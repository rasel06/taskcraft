export const ALLOWED_ATTACHMENT_TYPES: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "text/markdown": [".md"],
};

export const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(Object.values(ALLOWED_ATTACHMENT_TYPES).flat());

export const ATTACHMENT_ACCEPT = [...Object.keys(ALLOWED_ATTACHMENT_TYPES), ...ALLOWED_ATTACHMENT_EXTENSIONS].join(",");

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export function isAllowedAttachment(fileName: string): boolean {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return ALLOWED_ATTACHMENT_EXTENSIONS.has(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface IssueAttachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export function isImageAttachment(fileType: string): boolean {
  return fileType.startsWith("image/");
}

// Issue.attachments stores a JSON array of IssueAttachment. Older rows hold a
// comma-separated list of bare file names that were never uploaded, so they
// have nothing to preview or download and are dropped here.
export function parseIssueAttachments(raw: string | null | undefined): IssueAttachment[] {
  if (!raw || !raw.trim().startsWith("[")) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is IssueAttachment =>
        !!a && typeof a.fileName === "string" && typeof a.url === "string" && typeof a.fileType === "string" && typeof a.fileSize === "number",
    );
  } catch {
    return [];
  }
}

export function serializeIssueAttachments(attachments: IssueAttachment[]): string {
  return attachments.length ? JSON.stringify(attachments) : "";
}
