// Server-side validation for menu_items.image_url. Kept in lib rather than in a
// route file so both POST /api/menu and PATCH /api/menu/[id] can use it without
// importing one route from another.
//
// The column holds three possible shapes:
//   - an inline data URL from the file picker ("data:image/webp;base64,...")
//   - an absolute http(s) URL
//   - a path under /public ("/drinks/kaff-latte.png")

// Ceiling on an inline upload. image_url is a TEXT column, so without this a
// client could push an arbitrarily large row. A 600px WebP is ~40-80 KB of
// base64, so this only fires on something unexpected.
export const MAX_DATA_URL_CHARS = 1_500_000;

// Returns an error message for an unusable value, or null when it is fine.
// undefined/null/"" mean "no image supplied", which every caller handles itself
// (falling back to the placeholder or leaving the column alone).
export function validateImageValue(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value !== "string") return "Image must be a string.";

  if (value.startsWith("data:image/")) {
    return value.length > MAX_DATA_URL_CHARS
      ? "That image is too large. Pick a smaller photo."
      : null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) return null;

  // Public-folder path: single leading slash, no backslashes, no line breaks.
  // This is what rejects a pasted OS path like "C:\pics\latte.jpg", which the
  // app could store but could never render.
  if (/^\/[^\r\n]*$/.test(value) && !value.includes("\\")) return null;

  return "Image must be an uploaded file, an http(s) link, or a path starting with /";
}