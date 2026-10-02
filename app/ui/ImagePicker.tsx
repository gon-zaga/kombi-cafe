'use client'

// Image field for the Add/Edit menu item modals: pick a file from the machine,
// or paste a path/URL as before. Whichever is used, the value is just a string
// stored in menu_items.image_url, so the API needs no special case.
import { useRef, useState } from "react";
import { fileToDataUrl, isDataUrl, slugifyImageName } from "@/app/lib/imageUpload";

/* eslint-disable @next/next/no-img-element --
   The preview renders a plain <img> because it can show any of the three
   accepted shapes (path, http(s) URL, data URL), none of which should go
   through the next/image optimizer. */

interface ImagePickerProps {
  label?: string;

  // Current value: "/drinks/x.png", "https://…", or a data URL
  value: string;

  onChange: (value: string) => void;

  // The drink's name, used to derive the image's own name (kombi_cappuccino.webp)
  itemName?: string;
}

export default function ImagePicker({
  label = "Image",
  value,
  onChange,
  itemName,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setBusy(true);
    setError("");

    try {
      onChange(await fileToDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    } finally {
      setBusy(false);

      // Reset the input so picking the same file twice in a row still fires
      // onChange; otherwise the change event is a no-op the second time.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <div className="flex items-start gap-3">
        {/* Preview. The dashed box is the click target for the file picker,
            so there is no separate "Browse" button to hunt for. */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-24 h-24 shrink-0 rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-500 flex items-center justify-center overflow-hidden bg-gray-50 transition-colors disabled:opacity-60"
          aria-label="Choose an image file"
        >
          {value ? (
            <img
              src={value}
              alt="Selected item preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-500 text-center px-1">
              {busy ? "Processing..." : "Choose image"}
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <input
            type="file"
            accept="image/*"
            ref={inputRef}
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />

          <input
            type="text"
            value={isDataUrl(value) ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="/drinks/item-name.jpg"
          />

          <p className="text-xs text-gray-500 mt-1">
            Pick a file, or paste a path/URL. Uploaded photos are resized to
            600px automatically.
          </p>

          {/* The name the image is known by, derived from the drink name.
              Shown only for an inline upload: a pasted path already has a name
              the owner typed. */}
          {value && isDataUrl(value) && itemName && (
            <p className="text-xs text-gray-500 mt-1">
              Image name:{" "}
              <span className="font-mono text-gray-700">
                {slugifyImageName(itemName)}
              </span>
            </p>
          )}

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="mt-1 text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Remove image
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}