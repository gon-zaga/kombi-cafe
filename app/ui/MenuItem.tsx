import ProductCard from "./ProductCard";
import { menuItems } from "../lib/data";

function MenuItem({active}: {active: string}) {

  const filtered = menuItems.filter(item => item.category === active);

  return (
    <div className="px-5 grid grid-cols-2 gap-4">
      {
        // If All is selected
        active === "All" ? menuItems.map((item) => (
          <ProductCard item={item} key={item.itemId}/>
        ))
        
        // if the categories are selected
        :filtered.map((item) =>(  
          <ProductCard item={item} key={item.itemId}/> 
      ) )
      }
    </div>
  );
} 

export default MenuItem;