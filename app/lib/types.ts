export type MenuRow = {
  item_id: number;
  item_name: string;
  item_img: string | null;
  category: string | null;
  size_id: number;
  size: string;
  oz: number | null;
  temperature: string | null;
  price: number;
}

export type MenuItem = {
  itemId: number;
  itemName: string;
  itemImg: string | null;
  category: string | null;
  ingredients: string[];
  sizes: {
    size: string;
    oz: number | null;
    temperature: string | null;
    price: number;
  }[]
}