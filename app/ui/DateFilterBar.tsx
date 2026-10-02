'use client'

// Range chips + custom from/to panel, shared by the owner dashboard and the
// sales report. The parent owns the applied selection; this component only owns
// the values being typed and the validation message, so a half-typed date never
// triggers a refetch.
import { useState } from "react";
import type { CustomRange, DateFilter } from "@/app/lib/dateFilter";
import { DATE_FILTERS } from "@/app/lib/dateFilter";

interface DateFilterBarProps {
  filter: DateFilter;

  // The custom window currently applied, so the bar can show what is live
  customRange: CustomRange | null;

  onFilterChange: (filter: DateFilter) => void;

  // Called only when both dates are present and the range makes sense
  onCustomApply: (range: CustomRange) => void;
}

export default function DateFilterBar({
  filter,
  customRange,
  onFilterChange,
  onCustomApply,
}: DateFilterBarProps) {
  // The dates being typed. Kept separate from customRange (the applied window)
  // so editing a field doesn't refetch before Apply is pressed, and so switching
  // chips back and forth keeps what was typed.
  const [from, setFrom] = useState(customRange?.from ?? "");
  const [to, setTo] = useState(customRange?.to ?? "");
  const [error, setError] = useState("");

  // Checks the two fields. Returns the range to apply, or an error to show
  // instead, so an impossible range never reaches the API.
  const validate = (): { range: CustomRange | null; error: string } => {
    if (!from || !to) {
      return { range: null, error: "Pick both a start and an end date." };
    }

    // ISO dates compare correctly as plain strings, so no Date parsing needed
    if (from > to) {
      return {
        range: null,
        error: "The start date must be on or before the end date.",
      };
    }

    return { range: { from, to }, error: "" };
  };

  const handleApply = () => {
    const result = validate();
    setError(result.error);
    if (result.range) onCustomApply(result.range);
  };

  const handleSelect = (key: DateFilter) => {
    setError("");
    onFilterChange(key);
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto">
        {DATE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => handleSelect(f.key)}
            aria-pressed={filter === f.key}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-dark-brown text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "custom" && (
        <div className="mt-3 bg-white rounded-lg p-4 shadow">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="filter-from"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                From
              </label>
              <input
                id="filter-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="filter-to"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                To
              </label>
              <input
                id="filter-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-800 text-white hover:bg-amber-700 transition-colors"
            >
              Apply
            </button>
          </div>

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

          {/* Says which window is live, so it is obvious the numbers still show
              the previous range until Apply is pressed */}
          <p className="text-xs text-gray-500 mt-2">
            {customRange
              ? `Showing ${customRange.from} to ${customRange.to}`
              : "Pick both dates, then press Apply."}
          </p>
        </div>
      )}
    </div>
  );
}