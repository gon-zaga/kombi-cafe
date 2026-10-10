'use client'

import { useState } from "react";

// Payment-method picker: the customer chooses how they intend to pay.
// Two options only -- Counter (cash at the counter) or GCash. Choosing
// GCash reveals a required reference-number field: the customer reads the
// number from their GCash app and keys it in before the order can be
// placed. The staff still handles the actual payment at the counter, so
// nothing is charged here; the reference is what they check against.
// No payment integration lives in this system.

export type PaymentMethod = "counter" | "gcash";

interface PaymentMethodSelectorProps {
   value: PaymentMethod;
   onChange: (method: PaymentMethod) => void;
   reference: string;
   onReferenceChange: (value: string) => void;
   photo: string | null;
   onPhotoChange: (value: string | null) => void;
   error?: string;
   photoError?: string;
 }

export default function PaymentMethodSelector({
    value,
    onChange,
    reference,
    onReferenceChange,
    photo,
    onPhotoChange,
    error,
}: PaymentMethodSelectorProps) {
    const selectedStyle =
      "border-amber-800 bg-amber-50 ring-2 ring-amber-800/20";
    const unselectedStyle =
      "border-dark-brown/20 bg-white hover:border-amber-400";
    
    const [photoError, setPhotoError] = useState("");

   return (
     <div className="mt-3">
       <span className="block text-sm font-semibold text-dark-brown mb-2">
         How will you pay?
       </span>

       <div className="grid grid-cols-2 gap-2">
         <button
           type="button"
           onClick={() => onChange("counter")}
           className={`rounded-xl border p-3 text-left transition-colors ${
             value === "counter" ? selectedStyle : unselectedStyle
           }`}
         >
           <div className="flex items-center gap-2">
             <span className="text-lg">💵</span>
             <span className="font-semibold text-dark-brown">Counter</span>
           </div>
           <p className="text-xs text-gray-500 mt-0.5">Pay cash when you collect</p>
         </button>

         <button
           type="button"
           onClick={() => onChange("gcash")}
           className={`rounded-xl border p-3 text-left transition-colors ${
             value === "gcash" ? selectedStyle : unselectedStyle
           }`}
         >
           <div className="flex items-center gap-2">
             <span className="text-lg">📱</span>
             <span className="font-semibold text-dark-brown">GCash</span>
           </div>
           <p className="text-xs text-gray-500 mt-0.5">Pay via GCash app</p>
         </button>
       </div>

       {value === "gcash" && (
         <div className="mt-3 space-y-3">
           <div>
             <label
               htmlFor="gcash-reference"
               className="block text-sm font-semibold text-dark-brown mb-1"
             >
               GCash reference number <span className="text-red-600">*</span>
             </label>
             <input
               id="gcash-reference"
               type="text"
               inputMode="numeric"
               value={reference}
               onChange={(e) => onReferenceChange(e.target.value.replace(/[^0-9]/g, ""))}
               placeholder="e.g. 9123456789"
               className="w-full bg-white border border-dark-brown/30 rounded-lg px-3 py-2 font-mono text-dark-brown focus:outline-none focus:ring-2 focus:ring-amber-800/30 placeholder:text-dark-brown/40"
               aria-required="true"
               aria-invalid={Boolean(error)}
             />
             <p className="text-xs text-gray-500 mt-1">
               The barista will verify the reference number
             </p>
             {error && (
               <p className="text-xs text-red-600 mt-1" role="alert">
                 {error}
               </p>
             )}
           </div>
           <div>
             <label
               htmlFor="gcash-photo"
               className="block text-sm font-semibold text-dark-brown mb-1"
             >
               GCash transaction photo <span className="text-red-600">*</span>
             </label>
              <input
               id="gcash-photo"
               type="file"
               accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
               onChange={(e) => {
                 const file = e.target.files?.[0];
                 if (file) {
                   // Import and use the fileToDataUrl function
                   import("@/app/lib/imageUpload").then(({ fileToDataUrl }) => {
                     fileToDataUrl(file)
                       .then((dataUrl) => {
                         onPhotoChange(dataUrl);
                         setPhotoError("");
                       })
                       .catch((err) => {
                         setPhotoError(err instanceof Error ? err.message : "Could not process that image.");
                         onPhotoChange(null);
                       });
                   });
                 } else {
                   onPhotoChange(null);
                   setPhotoError("");
                 }
               }}
               className="w-full bg-white border border-dark-brown/30 rounded-lg px-3 py-2 text-sm font-mono text-dark-brown focus:outline-none focus:ring-2 focus:ring-amber-800/30"
             >
              </input>
              <p className="text-xs text-gray-500 mt-1">
                Upload a photo of your GCash transaction for verification
              </p>
              {photoError && (
                <p className="text-xs text-red-600 mt-1" role="alert">
                  {photoError}
                </p>
              )}
            </div>
         </div>
       )}
     </div>
   );
 }