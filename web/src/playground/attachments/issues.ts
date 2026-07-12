import type { AttachmentIssue } from './types';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function formatAttachmentIssue(t: Translate, issue: AttachmentIssue): string {
  return t(`playground.${issue.code}`, issue.params);
}

export function formatAttachmentErrors(
  t: Translate,
  errors: Array<{ name: string; issue: AttachmentIssue }>,
): string {
  return errors.map(item => `${item.name}: ${formatAttachmentIssue(t, item.issue)}`).join('\n');
}
