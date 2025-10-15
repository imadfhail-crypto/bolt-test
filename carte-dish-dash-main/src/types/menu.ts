export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type MenuCategory = 
  | "Plats de Poulet" 
  | "Plats de Crevettes" 
  | "Plats de Légumes" 
  | "Menus" 
  | "Entrées" 
  | "Naans" 
  | "Riz & Accompagnements" 
  | "Desserts" 
  | "Boissons Maison" 
  | "Boissons Fraîches" 
  | "Lassi"
  | "Rice Box";
