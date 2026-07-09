import type { AttachmentIssue } from './types';

type Translate = (key: string, options?: Record<string, unknown>) => string;

// issue code → i18n key + 中文兜底文案（core i18n 未更新时也可用）。
const ISSUE_DEFAULTS: Record<string, string> = {
  'attachment.unsupported_type': '不支持的文件类型',
  'attachment.too_many': '单次最多 {{limit}} 个附件',
  'attachment.too_many_images': '单次最多 {{limit}} 张图片',
  'attachment.total_too_large': '附件总大小超过 {{limit_mb}}MB 上限',
  'attachment.file_too_large': '文件超过 {{limit_mb}}MB 上限',
  'attachment.image_too_large': '图片超过 {{limit_mb}}MB 上限',
  'attachment.image_total_too_large': '本条消息图片合计超过 {{limit_mb}}MB，请减少图片数量',
  'attachment.busy': '正在解析附件，请稍候再添加',
  'attachment.image_pixels_exceeded': '图片像素超过 {{limit_mp}}MP 上限',
  'attachment.image_decode_failed': '图片无法解码，可能是不支持的格式',
  'attachment.image_compress_failed': '图片压缩失败，请缩小后重试',
  'attachment.gif_flattened': 'GIF 过大，已取首帧压缩（动画丢失）',
  'attachment.pdf_encrypted': 'PDF 已加密，无法读取',
  'attachment.pdf_parse_failed': 'PDF 解析失败，文件可能已损坏',
  'attachment.pdf_scanned': '这是扫描件 PDF（无文本层），暂不支持 OCR 识别',
  'attachment.pdf_maybe_scanned': '文本很少，可能是扫描件，识别结果或不完整',
  'attachment.pdf_pages_truncated': '共 {{total}} 页，仅解析前 {{kept}} 页',
  'attachment.extract_budget_exhausted': '本条消息可附带的文本量已用尽，请删除部分附件',
  'attachment.empty_content': '未能从文件中提取到内容',
  'attachment.email_no_body': '未找到邮件正文',
  'attachment.webpage_empty': '未能提取到网页正文',
  'attachment.charset_fallback': '已按 {{charset}} 编码解码',
  'attachment.truncated': '内容超长，已截断',
  'attachment.parse_failed': '文件解析失败',
};

export function formatAttachmentIssue(t: Translate, issue: AttachmentIssue): string {
  const defaultValue = ISSUE_DEFAULTS[issue.code] || ISSUE_DEFAULTS['attachment.parse_failed'];
  return t(`playground.${issue.code}`, { defaultValue, ...issue.params });
}

export function formatAttachmentErrors(
  t: Translate,
  errors: Array<{ name: string; issue: AttachmentIssue }>,
): string {
  return errors.map(item => `${item.name}: ${formatAttachmentIssue(t, item.issue)}`).join('\n');
}
