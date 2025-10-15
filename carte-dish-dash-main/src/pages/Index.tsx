import { useState, useEffect } from "react";
import { MenuItem, CartItem, MenuCategory } from "@/types/menu";
import { menuItems, categories } from "@/data/menuData";
import { MenuCard } from "@/components/MenuCard";
import { Cart } from "@/components/Cart";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Clock, MapPin } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowAuthDialog(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre commande.`,
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeItem(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Retiré du panier",
      description: "L'article a été retiré de votre commande.",
      variant: "destructive",
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative h-[400px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        </div>
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-start text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">
            BOLLYWOOD
          </h1>
          <p className="text-xl md:text-2xl mb-6 drop-shadow-md">
            Restaurant Indien - Plats à Emporter
          </p>
          <div className="flex flex-wrap gap-4 text-sm md:text-base">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Phone className="h-4 w-4" />
              <span className="font-semibold">02 31 55 51 80</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Clock className="h-4 w-4" />
              <span>Ouvert 7j/7</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin className="h-4 w-4" />
              <span>À emporter uniquement</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Menu Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2 text-foreground">Notre Carte</h2>
              <p className="text-muted-foreground">
                Le riz en accompagnement est compris dans le prix des plats. 
                Vous pouvez avoir des nouilles à la place du riz pour 2€ en plus.
              </p>
            </div>

            <Tabs defaultValue={categories[0]} className="w-full">
              <TabsList className="w-full flex-wrap h-auto gap-2 bg-muted/50 p-2 mb-6">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {menuItems
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <MenuCard
                          key={item.id}
                          item={item}
                          onAddToCart={addToCart}
                        />
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Cart Section */}
          <div>
            <Cart
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              user={user}
              onAuthRequired={() => setShowAuthDialog(true)}
              onOrderSuccess={clearCart}
            />
          </div>
        </div>
      </main>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <AuthForm />
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-muted mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4 text-primary">Restaurant Bollywood</h3>
          <div className="space-y-2 text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              <span className="font-semibold">02 31 55 51 80</span>
            </p>
            <p>Plats à emporter uniquement</p>
            <p className="text-sm mt-4">
              Les plats servis sont adaptés aux goûts de notre clientèle, 
              n'hésitez pas à demander que le vôtre soit plus épicé !
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
