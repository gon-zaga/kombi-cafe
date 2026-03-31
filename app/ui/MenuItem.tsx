import ProductCard from "./ProductCard";
import { menuItems } from "../lib/data";

function MenuItem() {

  return (
    <div className="px-5 grid grid-cols-2 gap-4">
      {menuItems.map((item) =>(
          <ProductCard item={item} key={item.itemId}/> 
      ) )
      }
    </div>
  );
}

export default MenuItem;