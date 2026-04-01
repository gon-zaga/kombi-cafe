type Size = {
  size: string;
  price: number;
};

type SizeSelectorProps = {
  sizes: Size[];
  selectedSize: Size;
  onSelect: (size: Size) => void;
};

export default function SizeSelector({ sizes, selectedSize, onSelect }: SizeSelectorProps) {
  return (
    <div className="flex justify-center">
      <section className="flex flex-col h-auto p-4 w-4/5 shrink-0 bg-[#F4EBD0] rounded-2xl shadow-lg cursor-pointer">
        {sizes.map((s) => (
          <div
            key={s.size}
            onClick={() => onSelect(s)}
            className={`flex flex-row justify-between items-center px-3 py-2 rounded-lg
              ${selectedSize.size === s.size ? "text-white bg-dark-brown" : ""}`}
          >
            <div className="w-3">{s.size}</div>
            <div>₱{s.price}</div>
            <input
              type="radio"
              name="size"
              value={s.size}
              checked={selectedSize.size === s.size}
              onChange={() => onSelect(s)}
            />
          </div>
        ))}
      </section>
    </div>
  );
}