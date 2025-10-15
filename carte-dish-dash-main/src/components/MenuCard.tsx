import { MenuItem } from "@/types/menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuCard = ({ item, onAddToCart }: MenuCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all duration-300 bg-gradient-to-b from-card to-muted/20 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm min-h-[2.5rem]">
          {item.description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between pt-2">
        <span className="text-2xl font-bold text-primary">{item.price.toFixed(2)}€</span>
        <Button 
          size="sm" 
          onClick={() => onAddToCart(item)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </CardFooter>
    </Card>
  );
};
