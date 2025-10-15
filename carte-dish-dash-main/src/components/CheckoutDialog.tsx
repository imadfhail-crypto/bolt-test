import { useState } from "react";
import { CartItem } from "@/types/menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { fr } from "date-fns/locale";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  total: number;
  onSuccess: () => void;
}

export const CheckoutDialog = ({ open, onOpenChange, items, total, onSuccess }: CheckoutDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  // Générer les créneaux horaires (11:00 - 22:00)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    for (let hour = 11; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Si c'est aujourd'hui, n'afficher que les créneaux futurs (+ 30 min minimum)
        if (selectedDate && format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")) {
          if (hour < currentHour || (hour === currentHour && minute <= currentMinute + 30)) {
            continue;
          }
        }
        slots.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
      }
    }
    return slots;
  };

  const handleCheckout = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Information manquante",
        description: "Veuillez sélectionner une date et une heure de récupération.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Créer la date/heure de récupération
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const pickupDateTime = setMinutes(setHours(selectedDate, hours), minutes);

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          user_id: user.id,
          customer_name: user.user_metadata.full_name || user.email,
          customer_email: user.email!,
          customer_phone: user.user_metadata.phone || "",
          pickup_time: pickupDateTime.toISOString(),
          total_amount: total,
          notes: notes,
          status: "pending" as const,
          order_number: "",
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les items de commande
      const orderItems = items.map((item) => ({
        order_id: order.id,
        item_name: item.name,
        item_category: item.category,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Commande créée",
        description: `Votre commande N°${order.order_number} a été enregistrée. Récupération prévue le ${format(pickupDateTime, "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finaliser la commande</DialogTitle>
          <DialogDescription>
            Choisissez l'heure de récupération de votre commande
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date de récupération
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date > addMinutes(new Date(), 60 * 24 * 7)}
              locale={fr}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Heure de récupération
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une heure" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Instructions spéciales, préférences d'épices, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total à payer</span>
              <span className="text-2xl text-primary">{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleCheckout} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Valider la commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};