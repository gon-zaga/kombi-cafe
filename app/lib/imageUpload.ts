// Client-side image handling for menu item photos: shrink a picked file down to
// a reasonable size and turn it into a data URL that can be stored in
// menu_items.image_url.
//
// Resizing happens in the browser on purpose. A phone photo is 3-8 MB; sending
// that as JSON would bloat the request and the row it lands in. Downscaling to
// 600px WebP first brings a typical drink photo to ~40 KB.

// Longest edge of the stored image. Menu cards render at 110-140px, so 600px
// still covers a high-DPI screen with room to spare.
const MAX_DIMENSION = 600;

const QUALITY = 0.8;

// Rejects absurd inputs before decoding. 10 MB is well past any real photo a
// café owner would pick, and decoding a huge file can hang the tab.
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

// Guard against a pathological row. A 600px WebP is ~40-80 KB of base64; this
// ceiling is roughly 20x that, so it only ever fires on something unexpected.
export const MAX_DATA_URL_CHARS = 1_500_000;

// True for an inline image ("data:image/webp;base64,...") as opposed to a path
// or http(s) URL. Callers need to know because next/image handles the two
// differently.
export function isDataUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("data:image/");
}

// Builds the name an image is known by, derived from the drink name:
// "Kombi Cappuccino" -> "kombi_cappuccino.webp".
//
// ⚠️ This is a LABEL, not a path on disk. The bytes live in the database as a
// data URL, so no file is written anywhere. It exists so an uploaded image is
// identifiable (in the UI, in exports, in the database) and so the intended
// filename is already decided if the app ever moves to real file storage.
export function slugifyImageName(itemName: string): string {
  const slug = itemName
    .toLowerCase()
    // Anything that isn't a letter or digit becomes an underscore
    .replace(/[^a-z0-9]+/g, "_")
    // Collapse runs of underscores and trim the ends
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  // An item named only in characters/symbols would slug to nothing, so fall
  // back to a generic name rather than storing ".webp"
  return `${slug || "menu_item"}.webp`;
}

// Decodes the picked file into something drawable. createImageBitmap is the
// fast path; the Image element is the fallback for browsers without it.
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

// Reads a File and returns a downscaled data URL.
export async function fileToDataUrl(file: File): Promise<string> {
  // Validate file type: only allow JPEG, PNG, SVG
  const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, JPEG, PNG, and SVG images are allowed.");
  }

  // Additionally validate file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.svg'];
  const fileNameLower = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some(ext => fileNameLower.endsWith(ext));
  if (!hasAllowedExtension) {
    throw new Error("Image file must have a .jpg, .jpeg, .png, or .svg extension.");
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image is larger than 10 MB. Pick a smaller one.");
  }

  const source = await loadImageSource(file);

  // Only shrink, never enlarge: upscaling a small image wastes bytes and looks
  // worse. scale is capped at 1 for that reason.
  const longestEdge = Math.max(source.width, source.height);
  const scale = Math.min(1, MAX_DIMENSION / longestEdge);

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

  // Release the decoded bitmap immediately; browsers hold the full-size pixels
  // in memory until it is closed
  if ("close" in source) source.close();

  // WebP at the same quality is noticeably smaller than JPEG. Browsers that
  // can't encode WebP silently return a PNG data URL instead, which is why the
  // result is checked rather than assumed.
  const webp = canvas.toDataURL("image/webp", QUALITY);
  const dataUrl = webp.startsWith("data:image/webp")
    ? webp
    : canvas.toDataURL("image/jpeg", QUALITY);

  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    throw new Error("That image is still too large after resizing.");
  }

  return dataUrl;
}