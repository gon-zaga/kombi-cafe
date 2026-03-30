import ProductCard from "./ProductCard";

function MenuItem() {

  return (
    <div className="px-5 grid grid-cols-2 gap-4">
      <ProductCard />
      <ProductCard />
    </div>
  );
}

export default MenuItem;