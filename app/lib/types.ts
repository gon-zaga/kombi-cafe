export type MenuRow = {
  item_id: number;
  item_name: string;
  item_img: string | null;
  category: string | null;
  is_available: boolean;
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
  isAvailable: boolean;
  ingredients: string[];
  sizes: {
    sizeId: number;
    size: string;
    oz: number | null;
    temperature: string | null;
    price: number;
  }[]
}

export type OrderSummary = {
  id: number;
  orderReference: string;
  status: 'pending' | 'preparing' | 'ready';
  createdAt: string;
  total: number;
  items: {
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
    addOns: string[];
  }[];
}
