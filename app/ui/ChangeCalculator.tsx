'use client'

// Grocery-store change calculator: key in (or tap) the cash the
// customer handed over and it shows the change due against the
// order total. Purely a counter tool -- nothing is stored; the
// order record itself is the receipt.
import { useState } from "react";

// Peso bills a barista most commonly counts back with
const BILL_KEYS = [20, 50, 100, 200, 500, 1000];

// Money only ever has two decimals; rounding keeps float noise
// from turning a 380.00 change into 379.99999999
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface ChangeCalculatorProps {
  total: number;
}

function ChangeCalculator({ total }: ChangeCalculatorProps) {
  const [cashText, setCashText] = useState("");

  const cash = parseFloat(cashText);
  const hasCash = !Number.isNaN(cash) && cash >= 0;

  const change = hasCash ? round2(cash - total) : 0;
  const isShort = hasCash && change < 0;
  const isExact = hasCash && change === 0;

  // Tapping a bill adds it on top of what was already keyed in,
  // the same way a register totals the notes in the tray
  const addBill = (bill: number) => {
    const current = Number.isNaN(cash) ? 0 : cash;
    setCashText(String(round2(current + bill)));
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">Order total</span>
        <span className="font-semibold text-gray-900">₱{total.toFixed(2)}</span>
      </div>

      <label htmlFor="cash-given" className="block text-xs text-gray-500 mb-1">
        Cash given
      </label>
      <input
        id="cash-given"
        type="text"
        inputMode="decimal"
        value={cashText}
        onChange={(e) => setCashText(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder="0.00"
        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-lg font-mono text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400"
        aria-label="Cash given"
      />

      <div className="grid grid-cols-3 gap-1.5 mt-2">
        {BILL_KEYS.map((bill) => (
          <button
            key={bill}
            type="button"
            onClick={() => addBill(bill)}
            className="bg-white border border-amber-300 rounded-lg py-1.5 font-mono text-sm font-semibold text-amber-900 hover:bg-amber-100 active:scale-95 transition-transform"
          >
            ₱{bill}
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-between items-center border-t border-amber-200 pt-2">
        <span className={`text-sm ${isShort ? "text-red-600" : "text-gray-600"}`}>
          {isShort ? "Still need" : "Change"}
        </span>
        <span
          className={`text-xl font-mono font-bold ${
            isShort ? "text-red-600" : isExact ? "text-gray-900" : "text-green-700"
          }`}
        >
          {!hasCash ? "—" : isExact ? "EXACT" : `₱${Math.abs(change).toFixed(2)}`}
        </span>
      </div>

      {cashText !== "" && (
        <button
          type="button"
          onClick={() => setCashText("")}
          className="mt-2 w-full text-xs text-amber-800 hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default ChangeCalculator;
