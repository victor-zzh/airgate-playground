package playground

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/url"
	"path"
	"regexp"
	"strings"
	"time"

	sdk "github.com/DouDOU-start/airgate-sdk"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const assetURIHost = "asset"

var dataImageURLRE = regexp.MustCompile(`data:(image/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)`)

type ObjectStorage struct {
	client        *minio.Client
	bucket        string
	prefix        string
	publicBaseURL string
	presignTTL    time.Duration
}

type StoredAsset struct {
	ID          string
	ObjectKey   string
	ContentType string
	SizeBytes   int64
}

func NewObjectStorageFromConfig(cfg sdk.PluginConfig) (*ObjectStorage, error) {
	if cfg == nil {
		return nil, nil
	}
	endpoint := strings.TrimSpace(cfg.GetString("s3_endpoint"))
	bucket := strings.TrimSpace(cfg.GetString("s3_bucket"))
	accessKey := strings.TrimSpace(cfg.GetString("s3_access_key"))
	secretKey := strings.TrimSpace(cfg.GetString("s3_secret_key"))
	if endpoint == "" || bucket == "" || accessKey == "" || secretKey == "" {
		return nil, nil
	}

	useSSL := cfg.GetBool("s3_use_ssl")
	endpoint, endpointUseSSL := normalizeS3Endpoint(endpoint)
	if endpointUseSSL != nil {
		useSSL = *endpointUseSSL
	}

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		Region: strings.TrimSpace(cfg.GetString("s3_region")),
	})
	if err != nil {
		return nil, err
	}

	ttl := time.Duration(cfg.GetInt("s3_presign_ttl_minutes")) * time.Minute
	if ttl <= 0 {
		ttl = 6 * time.Hour
	}

	return &ObjectStorage{
		client:        client,
		bucket:        bucket,
		prefix:        cleanObjectPrefix(cfg.GetString("s3_path_prefix")),
		publicBaseURL: strings.TrimRight(strings.TrimSpace(cfg.GetString("s3_public_base_url")), "/"),
		presignTTL:    ttl,
	}, nil
}

func normalizeS3Endpoint(endpoint string) (string, *bool) {
	if parsed, err := url.Parse(endpoint); err == nil && parsed.Host != "" {
		useSSL := parsed.Scheme == "https"
		return parsed.Host, &useSSL
	}
	return strings.TrimRight(strings.TrimPrefix(strings.TrimPrefix(endpoint, "https://"), "http://"), "/"), nil
}

func cleanObjectPrefix(prefix string) string {
	prefix = strings.Trim(strings.TrimSpace(prefix), "/")
	if prefix == "." {
		return ""
	}
	return prefix
}

func newAssetID() (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]), nil
}

func assetURI(id string) string {
	return "airgate-asset://" + assetURIHost + "/" + id
}

func parseAssetURI(raw string) (string, bool) {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "airgate-asset" || u.Host != assetURIHost {
		return "", false
	}
	id := strings.TrimPrefix(u.Path, "/")
	return id, id != ""
}

func extensionForContentType(contentType string) string {
	switch strings.ToLower(contentType) {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	default:
		return ".bin"
	}
}

func (s *ObjectStorage) StoreImageDataURL(ctx context.Context, userID int, conversationID int64, dataURL string) (*StoredAsset, error) {
	match := dataImageURLRE.FindStringSubmatch(dataURL)
	if match == nil || match[0] != dataURL {
		return nil, fmt.Errorf("invalid image data url")
	}
	data, err := base64.StdEncoding.DecodeString(match[2])
	if err != nil {
		return nil, err
	}
	return s.StoreImageBytes(ctx, userID, conversationID, match[1], data)
}

func (s *ObjectStorage) StoreImageBase64(ctx context.Context, userID int, conversationID int64, contentType, encoded string) (*StoredAsset, error) {
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, err
	}
	return s.StoreImageBytes(ctx, userID, conversationID, contentType, data)
}

func (s *ObjectStorage) StoreImageBytes(ctx context.Context, userID int, conversationID int64, contentType string, data []byte) (*StoredAsset, error) {
	id, err := newAssetID()
	if err != nil {
		return nil, err
	}
	conversationSegment := "scratch"
	if conversationID > 0 {
		conversationSegment = fmt.Sprintf("conversation-%d", conversationID)
	}
	objectKey := path.Join(s.prefix, fmt.Sprintf("user-%d", userID), conversationSegment, id+extensionForContentType(contentType))
	_, err = s.client.PutObject(ctx, s.bucket, objectKey, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{
		ContentType:  contentType,
		CacheControl: "private, max-age=31536000, immutable",
	})
	if err != nil {
		return nil, err
	}
	return &StoredAsset{ID: id, ObjectKey: objectKey, ContentType: contentType, SizeBytes: int64(len(data))}, nil
}

func (s *ObjectStorage) PublicURL(ctx context.Context, objectKey string) (string, error) {
	if s.publicBaseURL != "" {
		return strings.TrimRight(s.publicBaseURL, "/") + "/" + strings.TrimLeft(objectKey, "/"), nil
	}
	u, err := s.client.PresignedGetObject(ctx, s.bucket, objectKey, s.presignTTL, nil)
	if err != nil {
		return "", err
	}
	return u.String(), nil
}
