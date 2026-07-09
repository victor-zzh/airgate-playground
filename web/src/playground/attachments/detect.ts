import type { AttachmentKind } from './types';

const TEXT_EXTENSION_RE = /\.(txt|md|markdown|csv|tsv|json|jsonl|log|xml|yaml|yml|ts|tsx|js|jsx|py|go|rs|java|kt|swift|sql|css|sh|toml|ini|conf|properties)$/i;

export function detectAttachmentKind(file: File): AttachmentKind | null {
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();

  if (type.startsWith('image/')) return 'image';
  if (name.endsWith('.pdf') || type === 'application/pdf') return 'pdf';
  if (/\.(xlsx|xls)$/.test(name)
    || type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || type === 'application/vnd.ms-excel') return 'sheet';
  if (name.endsWith('.eml') || type === 'message/rfc822') return 'email';
  // 网页保存文件（.html/.htm 按业务语义提取正文；代码类 .css/.js 走 text 原样）
  if (/\.(mht|mhtml)$/.test(name) || type === 'multipart/related') return 'webpage';
  if (/\.(html|htm)$/.test(name) || type === 'text/html') return 'webpage';
  if (TEXT_EXTENSION_RE.test(name) || type.startsWith('text/')) return 'text';
  return null;
}

export function attachmentAcceptList(): string {
  return [
    'image/*',
    '.pdf',
    '.xlsx', '.xls',
    '.eml', '.mht', '.mhtml', '.html', '.htm',
    '.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.jsonl', '.log', '.xml', '.yaml', '.yml',
    '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.kt', '.swift', '.sql', '.css',
    '.sh', '.toml', '.ini', '.conf', '.properties',
    'text/*',
  ].join(',');
}
