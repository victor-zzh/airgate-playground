package playground

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/url"
	"path/filepath"
	"regexp"
	"strings"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

const assetURIHost = "asset"

// 附件媒体 data URL：图片与视频（视频经 Gemini 系模型识别）共用资产落盘管线。
var dataImageURLRE = regexp.MustCompile(`data:(image/(?:png|jpeg|jpg|webp|gif)|video/(?:mp4|quicktime|webm|x-m4v));base64,([A-Za-z0-9+/=]+)`)

type ObjectStorage struct {
	host sdk.Host
}

type StoredAsset struct {
	ID          string
	ObjectKey   string
	PublicURL   string
	ContentType string
	SizeBytes   int64
}

func NewObjectStorage(host sdk.Host) *ObjectStorage {
	if host == nil {
		return nil
	}
	return &ObjectStorage{host: host}
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
	case "video/mp4":
		return ".mp4"
	case "video/quicktime":
		return ".mov"
	case "video/webm":
		return ".webm"
	case "video/x-m4v":
		return ".m4v"
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
	asset, err := hostStoreAsset(ctx, s.host, int64(userID), "chat", contentType, extensionForContentType(contentType), data)
	if err != nil {
		return nil, err
	}
	return &StoredAsset{
		ID:          asset.ID,
		ObjectKey:   filepath.ToSlash(asset.ObjectKey),
		PublicURL:   asset.PublicURL,
		ContentType: asset.ContentType,
		SizeBytes:   asset.SizeBytes,
	}, nil
}

// StoreDocumentBytes 存储生成文档(md/pdf),与图片同走 purpose=chat 生命周期
// (会话删除/孤儿清理自动覆盖)。
func (s *ObjectStorage) StoreDocumentBytes(ctx context.Context, userID int, contentType, fileExtension string, data []byte) (*StoredAsset, error) {
	asset, err := hostStoreAsset(ctx, s.host, int64(userID), "chat", contentType, fileExtension, data)
	if err != nil {
		return nil, err
	}
	return &StoredAsset{
		ID:          asset.ID,
		ObjectKey:   filepath.ToSlash(asset.ObjectKey),
		PublicURL:   asset.PublicURL,
		ContentType: asset.ContentType,
		SizeBytes:   asset.SizeBytes,
	}, nil
}

func (s *ObjectStorage) PublicURL(ctx context.Context, objectKey string) (string, error) {
	return hostGetAssetURL(ctx, s.host, objectKey)
}

func (s *ObjectStorage) GetBytes(ctx context.Context, objectKey string) (*hostAssetBytes, error) {
	return hostGetAssetBytes(ctx, s.host, objectKey)
}

func (s *ObjectStorage) Delete(ctx context.Context, objectKey string) error {
	return hostDeleteAsset(ctx, s.host, objectKey)
}
