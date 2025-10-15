import { CartItem } from "@/types/menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { useState } from "react";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  user: any;
  onAuthRequired: () => void;
  onOrderSuccess: () => void;
}

export const Cart = ({ items, onUpdateQuantity, onRemoveItem, user, onAuthRequired, onOrderSuccess }: CartProps) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutClick = () => {
    if (!user) {
      onAuthRequired();
    } else {
      setShowCheckout(true);
    }
  };

  const handleOrderSuccess = () => {
    onOrderSuccess();
    setShowCheckout(false);
  };

  return (
    <Card className="sticky top-4 h-fit shadow-[var(--shadow-elegant)]">
      <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Votre Commande ({itemCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Votre panier est vide</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.price.toFixed(2)}€</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-primary">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      {items.length > 0 && (
        <>
          <CardFooter className="flex-col gap-4 p-4 bg-muted/30">
            <Separator />
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-2xl text-primary">{total.toFixed(2)}€</span>
              </div>
              <Button onClick={handleCheckoutClick} className="w-full" size="lg">
                Commander
              </Button>
            </div>
          </CardFooter>

          <CheckoutDialog
            open={showCheckout}
            onOpenChange={setShowCheckout}
            items={items}
            total={total}
            onSuccess={handleOrderSuccess}
          />
        </>
      )}
    </Card>
  );
};
