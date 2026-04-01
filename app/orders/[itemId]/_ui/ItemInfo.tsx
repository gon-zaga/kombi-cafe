'use client'
type ItemInfoProps = {
  itemName: string,
  price: number;
  ingredients: string[];
}

function ItemInfo({itemName, price, ingredients}: ItemInfoProps) {
  return(
      <div className="flex flex-col gap-4 p-4"> 
      <div className="text-md font-bold">{itemName}</div>
      <div className="text-md font-bold">₱{price}</div>
      <div className="text-sm">{ingredients}[ingredients]</div>
      </div>
  );
}

export default ItemInfo