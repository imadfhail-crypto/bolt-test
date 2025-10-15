import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, RefreshCw, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  pickup_time: string;
  status: string;
  total_amount: number;
  created_at: string;
  notes: string;
}

export default function Manager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    preparing: "bg-orange-500",
    ready: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    preparing: "En préparation",
    ready: "Prête",
    completed: "Terminée",
    cancelled: "Annulée",
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled") => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
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
        description: "Le statut de la commande a été mis à jour.",
      });
      fetchOrders();
    }
  };

  const printOrder = async (orderId: string) => {
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (order && items) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Commande ${order.order_number}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #8B4513; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #8B4513; color: white; }
                .total { font-size: 20px; font-weight: bold; margin-top: 20px; }
              </style>
            </head>
            <body>
              <h1>Restaurant Bollywood</h1>
              <h2>Commande N° ${order.order_number}</h2>
              <p><strong>Client:</strong> ${order.customer_name}</p>
              <p><strong>Téléphone:</strong> ${order.customer_phone}</p>
              <p><strong>Heure de récupération:</strong> ${format(new Date(order.pickup_time), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
              ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ""}
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td>${item.item_name}</td>
                      <td>${item.quantity}</td>
                      <td>${item.unit_price.toFixed(2)}€</td>
                      <td>${item.total_price.toFixed(2)}€</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              <p class="total">Total: ${order.total_amount.toFixed(2)}€</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
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
          <h1 className="text-3xl font-bold">Gestion des commandes</h1>
          <div className="flex gap-2">
            <Button onClick={fetchOrders} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <p>Chargement...</p>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune commande pour le moment
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl">
                    Commande {order.order_number}
                  </CardTitle>
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p><strong>Client:</strong> {order.customer_name}</p>
                      <p><strong>Téléphone:</strong> {order.customer_phone}</p>
                      <p><strong>Récupération:</strong> {format(new Date(order.pickup_time), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
                      <p><strong>Montant:</strong> {order.total_amount.toFixed(2)}€</p>
                      {order.notes && (
                        <p><strong>Notes:</strong> {order.notes}</p>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Changer le statut
                        </label>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value as "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => printOrder(order.id)}
                        variant="outline"
                        className="w-full"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimer
                      </Button>
                    </div>
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