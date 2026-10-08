'use client'
import { useState, useRef, useEffect } from 'react';

type QuantitySelectorProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  max?: number;
};

export default function QuantitySelector({ quantity, onChange, max = 99 }: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState(String(quantity));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input with external quantity changes
  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  const increment = () => {
    const next = Math.min(quantity + 1, max);
    onChange(next);
    setInputValue(String(next));
  };

  const decrement = () => {
    const next = Math.max(quantity - 1, 1);
    onChange(next);
    setInputValue(String(next));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    if (/^\d*$/.test(value)) {
      setInputValue(value);
      if (value !== '') {
        const num = Number(value);
        if (num >= 1 && num <= max) {
          onChange(num);
        }
      }
    }
  };

  const handleBlur = () => {
    // On blur, validate and clamp
    const num = Number(inputValue) || 1;
    const clamped = Math.min(Math.max(num, 1), max);
    onChange(clamped);
    setInputValue(String(clamped));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex justify-center mb-6">
      <section className="flex flex-col items-center gap-3 w-4/5 shrink-0 bg-[#F4EBD0] rounded-2xl shadow-lg p-4">
        <label className="text-sm font-medium text-dark-brown/70">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={decrement}
            disabled={quantity <= 1}
            className="w-12 h-12 rounded-xl bg-dark-brown text-white text-xl font-medium hover:bg-dark-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-20 h-12 text-center text-2xl font-bold text-dark-brown bg-white rounded-xl border border-dark-brown/20 focus:outline-none focus:ring-2 focus:ring-amber-800/30"
            inputMode="numeric"
            aria-label="Quantity"
          />
          <button
            type="button"
            onClick={increment}
            disabled={quantity >= max}
            className="w-12 h-12 rounded-xl bg-dark-brown text-white text-xl font-medium hover:bg-dark-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <p className="text-xs text-dark-brown/50 text-center">Use ± buttons or type directly</p>
      </section>
    </div>
  );
}