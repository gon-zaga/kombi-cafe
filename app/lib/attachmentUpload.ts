// Client-side handling for bug-report attachments.
//
// Screenshots and log files are turned into base64 (data URL minus the prefix)
// so they can ride along in the existing JSON POST /api/bugs request and be
// forwarded to Bugzilla's attachment API. Nothing is persisted by the app.
//
// Images are downscaled on purpose: a full-resolution screenshot can be several
// MB, and base64 inflates that by ~33%. Shrinking anything over ~1.5 MB (or
// wider than 1600px) to 1600px WebP keeps request bodies small while leaving
// UI text in screenshots readable. Small screenshots are passed through
// untouched so they stay pixel-crisp.

export const MAX_ATTACHMENTS = 3;

export const MAX_IMAGE_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_BYTES = 1_000_000;

// Images larger than this (or wider than MAX_IMAGE_DIMENSION) get downscaled.
const DOWNSCALE_THRESHOLD_BYTES = 1_500_000;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.8;

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const ALLOWED_TEXT_EXTENSIONS = [".txt", ".log"];

export const ATTACHMENT_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,.txt,.log";

export interface Attachment {
  fileName: string;
  contentType: string;
  dataBase64: string;
  size: number;
}

function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

// Decodes a file into something drawable. createImageBitmap is the fast path;
// the Image element is the fallback for browsers without it.
function loadImageSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };

    img.src = url;
  });
}

async function downscaleSource(
  source: ImageBitmap | HTMLImageElement
): Promise<{ dataUrl: string; contentType: string }> {
  const longestEdge = Math.max(source.width, source.height);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestEdge);

  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not process that image.");
  }

  context.drawImage(source, 0, 0, width, height);

  const webp = canvas.toDataURL("image/webp", IMAGE_QUALITY);
  if (webp.startsWith("data:image/webp")) {
    return { dataUrl: webp, contentType: "image/webp" };
  }
  return { dataUrl: canvas.toDataURL("image/jpeg", IMAGE_QUALITY), contentType: "image/jpeg" };
}

// Converts one picked file into the payload the bug API expects. Throws with a
// user-facing message when the file is disallowed or too large.
export async function fileToAttachment(file: File): Promise<Attachment> {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const lowerName = file.name.toLowerCase();
  const isText = ALLOWED_TEXT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (!isImage && !isText) {
    throw new Error("Only PNG, JPG, WEBP, GIF images and .txt/.log files are allowed.");
  }

  if (isImage) {
    if (file.size > MAX_IMAGE_INPUT_BYTES) {
      throw new Error("Image is larger than 10 MB. Pick a smaller one.");
    }

    // Decode once to measure dimensions, then decide whether to shrink.
    const source = await loadImageSource(file);
    const longestEdge = Math.max(source.width, source.height);
    const needsShrink = file.size > DOWNSCALE_THRESHOLD_BYTES || longestEdge > MAX_IMAGE_DIMENSION;

    let dataUrl: string;
    let contentType: string = file.type;

    if (needsShrink) {
      const scaled = await downscaleSource(source);
      dataUrl = scaled.dataUrl;
      contentType = scaled.contentType;
    } else {
      dataUrl = await readAsDataUrl(file);
    }

    if ("close" in source) source.close();

    return {
      fileName: file.name,
      contentType,
      dataBase64: stripDataUrlPrefix(dataUrl),
      size: file.size,
    };
  }

  // Text / log file.
  if (file.size > MAX_TEXT_BYTES) {
    throw new Error("Text/log file is larger than 1 MB. Trim it and try again.");
  }

  const dataUrl = await readAsDataUrl(file);
  return {
    fileName: file.name,
    contentType: "text/plain",
    dataBase64: stripDataUrlPrefix(dataUrl),
    size: file.size,
  };
}