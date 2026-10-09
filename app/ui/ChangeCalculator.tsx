'use client'

// Grocery-store change calculator: key in (or tap) the cash the
// customer handed over and it shows the change due against the
// order total. Purely a counter tool -- nothing is stored; the
// order record itself is the receipt.
import { useState, useEffect } from "react";

// Peso bills a barista most commonly counts back with
const BILL_KEYS = [20, 50, 100, 200, 500, 1000];

// Calculator keypad layout: 0-9, decimal, clear, plus quick-bill keys
const CALC_KEYS = [
  { key: '7', action: 'digit' },
  { key: '8', action: 'digit' },
  { key: '9', action: 'digit' },
  { key: '4', action: 'digit' },
  { key: '5', action: 'digit' },
  { key: '6', action: 'digit' },
  { key: '1', action: 'digit' },
  { key: '2', action: 'digit' },
  { key: '3', action: 'digit' },
  { key: 'C', action: 'clear' },
  { key: '0', action: 'digit' },
  { key: '.', action: 'decimal' },
];

// Money only ever has two decimals; rounding keeps float noise
// from turning a 380.00 change into 379.99999999
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface ChangeCalculatorProps {
  total: number;
  /** True when the barista is not allowed to proceed until the
      change has been computed, e.g. before marking an order preparing. */
  gate?: boolean;
  onComputedChange?: (computed: boolean) => void;
}

function ChangeCalculator({ total, gate = false, onComputedChange }: ChangeCalculatorProps) {
  const [cashText, setCashText] = useState("");

  const cash = parseFloat(cashText);
  const hasCash = !Number.isNaN(cash) && cash >= 0;

  const change = hasCash ? round2(cash - total) : 0;
  const isShort = hasCash && change < 0;
  const isExact = hasCash && change === 0;

  // A "computed" order is one where the barista has entered a cash
  // amount, so the change is known. When gating, the parent uses this
  // to keep the action button disabled until then.
  const isComputed = hasCash;
  useEffect(() => {
    if (onComputedChange) onComputedChange(isComputed);
  }, [isComputed, onComputedChange]);

  const appendDigit = (digit: string) => {
    // Prevent multiple decimals
    if (digit === '.' && cashText.includes('.')) return;
    // Prevent leading zeros (except for "0.")
    if (cashText === '0' && digit !== '.') return;
    if (cashText === '' && digit === '.') {
      setCashText('0.');
      return;
    }
    setCashText(cashText + digit);
  };

  const clear = () => setCashText("");

  const addBill = (bill: number) => {
    const current = Number.isNaN(cash) ? 0 : cash;
    setCashText(String(round2(current + bill)));
  };

  return (
    <div
      className={`border rounded-xl p-3 ${
        gate && !isComputed
          ? "bg-amber-50 border-amber-300"
          : gate && isComputed
          ? "bg-emerald-50 border-emerald-300"
          : "bg-amber-50 border-amber-200"
      }`}
    >
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

      {/* Calculator keypad: 0-9, decimal, clear */}
      <div className="grid grid-cols-3 gap-1.5 mt-2">
        {CALC_KEYS.map(({ key, action }) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              action === 'digit' ? appendDigit(key) : action === 'decimal' ? appendDigit('.') : clear()
            }
            className="bg-white border border-amber-300 rounded-lg py-2 font-mono text-base font-semibold text-amber-900 hover:bg-amber-100 active:scale-95 transition-transform"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Quick bill buttons */}
      <div className="grid grid-cols-3 gap-1.5 mt-2">
        {BILL_KEYS.map((bill) => (
          <button
            key={`bill-${bill}`}
            type="button"
            onClick={() => addBill(bill)}
            className="bg-amber-50 border border-amber-300 rounded-lg py-1.5 font-mono text-sm font-semibold text-amber-900 hover:bg-amber-100 active:scale-95 transition-transform"
          >
            ₱{bill}
          </button>
        ))}
      </div>

       <div className="mt-3 flex justify-between items-center border-t border-amber-200 pt-2">
         <span className={`text-sm ${isShort ? "text-red-600" : "text-gray-600"}`}>
           {isShort ? "Insufficient Payment" : "Change"}
         </span>
        <span
          className={`text-xl font-mono font-bold ${
            isShort ? "text-red-600" : isExact ? "text-gray-900" : "text-green-700"
          }`}
        >
          {!hasCash ? "—" : isExact ? "EXACT" : `₱${Math.abs(change).toFixed(2)}`}
        </span>
      </div>

      {gate && !isComputed && (
        <p className="mt-2 text-xs font-medium text-amber-800">
          Enter the cash the customer handed over before marking this order.
        </p>
      )}
      {gate && isComputed && isShort && (
        <p className="mt-2 text-xs font-medium text-red-700">
          Customer is still short ₱{Math.abs(change).toFixed(2)}.
        </p>
      )}
      {gate && isComputed && !isShort && (
        <p className="mt-2 text-xs font-medium text-emerald-700">Change computed ✓</p>
      )}

      {cashText !== "" && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 w-full text-xs text-amber-800 hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default ChangeCalculator;