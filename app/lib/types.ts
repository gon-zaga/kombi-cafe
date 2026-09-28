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
  is_available: boolean;
}

export type MenuItem = {
  itemId: number;
  itemName: string;
  itemImg: string | null;
  category: string | null;
  ingredients: string[];
  sizes: {
    sizeId: number;
    size: string;
    oz: number | null;
    temperature: string | null;
    price: number;
  }[];
  isAvailable: boolean;
}

export type OrderSummary = {
  id: number;
  orderReference: string;
  status: 'pending' | 'preparing' | 'ready';
  createdAt: string;
  total: number;
  items: { name: string; size: string | null; quantity: number; unitPrice: number; addOns: string[] }[];
}
