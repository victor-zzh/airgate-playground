// 附件处理层的统一结构。所有文件先经 detectAttachmentKind 分类，
// 再由 processor 调对应抽取器，输出 ProcessedImage / ProcessedFile。

export type AttachmentKind = 'image' | 'pdf' | 'sheet' | 'email' | 'webpage' | 'text';

// 错误/警告用 code + params 表达，UI 层再经 i18n 格式化（保持抽取器纯逻辑可测）。
export interface AttachmentIssue {
  code: string;
  params?: Record<string, string | number>;
}

export class AttachmentError extends Error {
  issue: AttachmentIssue;

  constructor(issue: AttachmentIssue) {
    super(issue.code);
    this.name = 'AttachmentError';
    this.issue = issue;
  }
}

export interface ExtractedText {
  content: string;
  truncated: boolean;
  warnings: AttachmentIssue[];
}

export interface ProcessedImage {
  id: string;
  name: string;
  url: string; // data URL
  originalBytes: number;
  finalBytes: number;
  compressed: boolean;
  warnings: AttachmentIssue[];
}

export interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  size: number; // 原始文件字节数
  origin: Exclude<AttachmentKind, 'image'>;
  content: string;
  truncated: boolean;
  warnings: AttachmentIssue[];
}

export interface ProcessResult {
  images: ProcessedImage[];
  files: ProcessedFile[];
  // 逐文件失败不阻断整批，收集后统一展示。
  errors: Array<{ name: string; issue: AttachmentIssue }>;
}
