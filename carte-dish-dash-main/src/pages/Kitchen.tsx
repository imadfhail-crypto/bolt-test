import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RefreshCw, LogOut, ChefHat } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrderWithItems {
  id: string;
  order_number: string;
  customer_name: string;
  pickup_time: string;
  status: string;
  notes: string;
  items: Array<{
    item_name: string;
    item_category: string;
    quantity: number;
  }>;
}

export default function Kitchen() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    preparing: "bg-orange-500",
    ready: "bg-green-500",
  };

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    preparing: "En préparation",
    ready: "Prête",
  };

  const fetchActiveOrders = async () => {
    setLoading(true);
    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "confirmed", "preparing", "ready"])
      .order("pickup_time", { ascending: true });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Récupérer les items pour chaque commande
    const ordersWithItems: OrderWithItems[] = [];
    for (const order of ordersData || []) {
      const { data: items } = await supabase
        .from("order_items")
        .select("item_name, item_category, quantity")
        .eq("order_id", order.id);

      ordersWithItems.push({
        ...order,
        items: items || [],
      });
    }

    setOrders(ordersWithItems);
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveOrders();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchActiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled") => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Statut mis à jour",
        description: `La commande est maintenant "${statusLabels[newStatus]}"`,
      });
      fetchActiveOrders();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Cuisine - Commandes actives</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchActiveOrders} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p>Chargement...</p>
          ) : orders.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune commande active
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold">
                      {order.order_number}
                    </CardTitle>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 mt-2">
                    <p><strong>Client:</strong> {order.customer_name}</p>
                    <p><strong>Récupération:</strong> {format(new Date(order.pickup_time), "HH:mm", { locale: fr })}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-medium">{item.item_name}</span>
                        <Badge variant="outline" className="ml-2">
                          x{item.quantity}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm"><strong>Notes:</strong> {order.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {order.status === "pending" || order.status === "confirmed" ? (
                      <Button
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        className="w-full"
                        variant="default"
                      >
                        Commencer
                      </Button>
                    ) : order.status === "preparing" ? (
                      <Button
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        className="w-full"
                        variant="default"
                      >
                        Marquer prête
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}