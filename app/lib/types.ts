export type MenuRow = {
  item_id: number;
  item_name: string;
  item_img: string | null;
  category: string | null;
  is_available: boolean;
  created_at: string;
  // True when at least one recipe ingredient is at/below its restock threshold
  is_low_stock: boolean;
  size_id: number;
  size: string;
  oz: number | null;
  temperature: string | null;
  price: number;
};

export type MenuItem = {
  itemId: number;
  itemName: string;
  itemImg: string | null;
  category: string | null;
  isAvailable: boolean;
   // When the drink was created; drives the "NEW" badge on the customer menu
  createdAt: string;

  // Warning only: the item can still be ordered. The order API rejects an
  // order outright when a recipe ingredient is genuinely short (409)
  isLowStock: boolean;
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
  // 'completed' means the customer collected it. The order row is kept; the
// status only controls whether the barista board still shows it.
status: "pending" | "preparing" | "ready" | "completed";
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
