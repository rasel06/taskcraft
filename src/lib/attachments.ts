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
