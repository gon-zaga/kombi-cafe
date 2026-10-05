export type Size = {
  sizeId: number;
  size: string;
  oz: number | null;
  temperature: string | null;
  price: number;
};

type SizeSelectorProps = {
  sizes: Size[];
  selectedSize: Size;
  onSelect: (size: Size) => void;
};

export default function SizeSelector({ sizes, selectedSize, onSelect }: SizeSelectorProps) {
  return (
    <div className="flex justify-center mb-10">
      <section className="flex flex-col h-auto p-4 w-4/5 shrink-0 bg-[#F4EBD0] rounded-2xl shadow-lg cursor-pointer">
        {sizes.map((s) => (
          <div
            key={s.sizeId}
            onClick={() => onSelect(s)}
            className={`flex flex-col px-3 py-3 rounded-lg
              ${selectedSize.size === s.size ? "text-white bg-dark-brown" : "text-dark-brown"}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{s.size}</span>
              <span>₱{s.price}</span>
            </div>
            {s.oz && s.temperature && (
              <span className="text-xs opacity-70 mt-1">
                {s.oz}oz · {s.temperature === "hot" ? "Hot" : "Cold"}
              </span>
            )}
            <input
              type="radio"
              name="size"
              value={s.size}
              checked={selectedSize.size === s.size}
              onChange={() => onSelect(s)}
              className="mt-2 self-start"
            />
          </div>
        ))}
      </section>
    </div>
  );
}