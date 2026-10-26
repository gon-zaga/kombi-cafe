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
    <div className="mx-4 mt-4">
      <section className="flex flex-col h-auto p-4 w-full bg-[#F4EBD0] rounded-2xl shadow-lg cursor-pointer">
        {sizes.map((s) => (
          <div
            key={s.sizeId}
            onClick={() => onSelect(s)}
            className={`flex flex-col px-4 py-3 rounded-lg
              ${selectedSize.size === s.size ? "text-white bg-dark-brown" : "text-dark-brown"}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-base">{s.size}</span>
              <span className="font-medium text-base">₱{s.price}</span>
            </div>
            {s.oz && s.temperature && (
              <span className="text-sm opacity-70 mt-1">
                {s.oz}oz · {s.temperature === "hot" ? "Hot" : "Cold"}
              </span>
            )}
            <input
              type="radio"
              name="size"
              value={s.size}
              checked={selectedSize.size === s.size}
              onChange={() => onSelect(s)}
              className="mt-2 self-start w-5 h-5 accent-dark-brown"
            />
          </div>
        ))}
      </section>
    </div>
  );
}