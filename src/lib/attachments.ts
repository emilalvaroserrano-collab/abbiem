export type ChatAttachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: "image" | "file";
  /** Compressed JPEG data URL. Images only. */
  url?: string;
  /** Plain-text excerpt. Text files only. */
  text?: string;
};

const MAX_FILES = 4;
const MAX_BYTES = 12 * 1024 * 1024;

function uid() {
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function isTextFile(file: File) {
  if (file.type.startsWith("text/")) return true;
  if (/json|csv|xml|javascript|markdown|yaml/.test(file.type)) return true;
  return /\.(txt|md|csv|json|ts|tsx|js|jsx|py|html|css|yml|yaml|log)$/i.test(file.name);
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1024;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read that image."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      let quality = 0.72;
      let url = canvas.toDataURL("image/jpeg", quality);
      while (url.length > 380_000 && quality > 0.4) {
        quality -= 0.12;
        url = canvas.toDataURL("image/jpeg", quality);
      }
      URL.revokeObjectURL(objectUrl);
      resolve(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that image."));
    };
    img.src = objectUrl;
  });
}

export async function filesToAttachments(
  files: File[],
  already: number,
): Promise<{ attachments: ChatAttachment[]; errors: string[] }> {
  const room = Math.max(0, MAX_FILES - already);
  const errors: string[] = [];
  if (files.length > room) {
    errors.push(room === 0 ? "Four attachments is the limit." : `Only ${room} more will fit.`);
  }
  const attachments: ChatAttachment[] = [];
  for (const file of files.slice(0, room)) {
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name} is over 12 MB.`);
      continue;
    }
    if (file.type.startsWith("image/")) {
      try {
        const url = await compressImage(file);
        attachments.push({
          id: uid(),
          name: file.name || "image",
          mime: "image/jpeg",
          size: file.size,
          kind: "image",
          url,
        });
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Could not read ${file.name}.`);
      }
      continue;
    }
    const attachment: ChatAttachment = {
      id: uid(),
      name: file.name || "file",
      mime: file.type || "application/octet-stream",
      size: file.size,
      kind: "file",
    };
    if (isTextFile(file) && file.size <= 200_000) {
      attachment.text = (await file.text()).slice(0, 6000);
    }
    attachments.push(attachment);
  }
  return { attachments, errors };
}

export function attachmentNote(file: ChatAttachment) {
  if (file.kind === "image") return `[Image attached: ${file.name}]`;
  if (file.text) return `[File ${file.name}]\n${file.text}`;
  const kb = Math.max(1, Math.round(file.size / 1024));
  return `[File attached: ${file.name} (${file.mime}, ${kb} KB). The contents were not included.]`;
}
