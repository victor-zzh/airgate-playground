// 附件处理层统一限额。调整时同步更新 docs 计划与 i18n 错误文案。

// ── 单次消息总量 ──
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;
export const MAX_TOTAL_RAW_BYTES = 50 * 1024 * 1024;
// 所有非图片附件抽取文本的总预算（字符）。超出时后加入的文件被截断并标注。
export const MAX_TOTAL_EXTRACTED_CHARS = 240_000;

// ── 图片 ──
export const MAX_IMAGES_PER_MESSAGE = 8;
export const MAX_IMAGE_RAW_BYTES = 25 * 1024 * 1024;
// 单条消息压缩后图片二进制总预算：base64 膨胀 4/3 后 ≈26.7MB，
// 需留在后端 30MB 转发守卫与 Anthropic 32MB 请求上限之内。
export const MAX_TOTAL_IMAGE_BINARY_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 50_000_000; // 50MP
// 压缩后单图二进制目标上限：base64 膨胀 4/3 后仍低于 Claude/Bedrock 单图 5MB 限制。
export const IMAGE_TARGET_BYTES = Math.floor(3.5 * 1024 * 1024);
// 压缩阶梯：依次尝试，直到压进 IMAGE_TARGET_BYTES。
export const IMAGE_COMPRESSION_LADDER: ReadonlyArray<{ maxEdge: number; quality: number }> = [
  { maxEdge: 2000, quality: 0.84 },
  { maxEdge: 2000, quality: 0.68 },
  { maxEdge: 1600, quality: 0.68 },
  { maxEdge: 1280, quality: 0.68 },
];
// 已经小于目标且长边不超过该值的模型友好格式图片，原样发送不重压。
export const IMAGE_PASSTHROUGH_MAX_EDGE = 2000;
export const MODEL_FRIENDLY_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// ── 视频（仅 Gemini 系模型可识别）──
// 与图片共用 MAX_TOTAL_IMAGE_BINARY_BYTES 载荷预算；单视频上限留 2MB 余量给随附图片。
export const MAX_VIDEOS_PER_MESSAGE = 1;
export const MAX_VIDEO_RAW_BYTES = 18 * 1024 * 1024;
export const VIDEO_CONTENT_TYPE_BY_EXT: ReadonlyArray<[RegExp, string]> = [
  [/\.mp4$/i, 'video/mp4'],
  [/\.mov$/i, 'video/quicktime'],
  [/\.webm$/i, 'video/webm'],
  [/\.m4v$/i, 'video/x-m4v'],
];

// ── PDF ──
export const MAX_PDF_RAW_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_PAGES = 100;
export const MAX_PDF_CHARS = 200_000;
// 平均每页低于该字符数时判定为扫描件（无文本层）。
export const SCANNED_PDF_CHARS_PER_PAGE = 30;

// ── Excel ──
export const MAX_SHEET_RAW_BYTES = 10 * 1024 * 1024;
export const MAX_SHEETS_PER_WORKBOOK = 20;
// 行上限只防异常工作簿；实际可发送量仍受单文件 150k、单消息 240k 字符预算约束。
// 旧值 200 会让体积很小的窄表也过早截断，影响需求清单、日志等常见业务文件。
export const MAX_ROWS_PER_SHEET = 1000;
export const MAX_COLS_PER_SHEET = 40;
export const MAX_CELL_CHARS = 200;
export const MAX_SHEET_CHARS = 150_000;

// ── 邮件 / 网页 ──
export const MAX_EMAIL_RAW_BYTES = 5 * 1024 * 1024;
export const MAX_EMAIL_CHARS = 100_000;
export const MAX_WEBPAGE_RAW_BYTES = 5 * 1024 * 1024;
export const MAX_WEBPAGE_CHARS = 100_000;

// ── 纯文本 / 代码 / CSV ──
export const MAX_TEXT_RAW_BYTES = 5 * 1024 * 1024;
export const MAX_TEXT_CHARS = 200_000;

// 解码出的 U+FFFD 占比超过该值时，尝试按 GBK 重新解码（中文业务文件常见）。
export const CHARSET_FALLBACK_REPLACEMENT_RATIO = 0.02;

// 错误文案里的 MB 标签（统一取整口径）
export function mbLabel(bytes: number): number {
  return Math.round(bytes / 1024 / 1024);
}
