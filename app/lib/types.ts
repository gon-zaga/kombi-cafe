export type MenuRow = {
  item_id: number;
  item_name: string;
  item_img: string | null;
  category: string | null;
  is_available: boolean;
  // True when at least one recipe ingredient is at/below its restock threshold
  is_low_stock: boolean;
  size_id: number;
  size: string;
  oz: number | null;
  temperature: string | null;
  price: number;
  /** Ingredient names for this menu item */
  ingredients: string[];
};

export type MenuItem = {
  itemId: number;
  itemName: string;
  itemImg: string | null;
  category: string | null;
  isAvailable: boolean;

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
  }[];
  // Type discriminator: 'menu_item' for regular items, 'addon' for add-ons
  type: 'menu_item' | 'addon';
  // Unique key for React rendering (negative for add-ons to avoid collision with menu_items)
  uniqueKey: number;
  // Add-on specific fields (only populated when type === 'addon')
  stockQty?: number;
  restockThreshold?: number;
}

// One add-on attached to an order line, as it was charged:
// price and quantity are the snapshots stored in order_item_addons
export type OrderAddOn = {
  name: string;
  price: number;
  quantity: number;
};

export type OrderSummary = {
   id: number;
   orderReference: string;
   tableNumber?: number | null;
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
     addOns: OrderAddOn[];
     ingredients: string[];
   }[];
   // How the customer intends to pay. 'counter' = cash at the counter,
   // 'gcash' = GCash (no payment is taken here; the staff handles it).
   paymentMethod?: "counter" | "gcash" | null;
   // Required when paymentMethod is 'gcash': the reference number the
   // customer reads from their GCash app, for the staff to check against.
   gcashReference?: string | null;
   // Photo of the GCash transaction for verification purposes.
   gcashPhoto?: string | null;
 }
