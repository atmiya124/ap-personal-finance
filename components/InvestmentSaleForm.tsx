"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { sellInvestment } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/DatePicker";

interface Investment {
  id: string;
  name: string;
  symbol: string | null;
  quantity: number;
  purchasePrice: number;
}

interface InvestmentSaleFormProps {
  investment: Investment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InvestmentSaleForm({
  investment,
  open,
  onOpenChange,
  onSuccess,
}: InvestmentSaleFormProps) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellDate, setSellDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sellQuantity = parseFloat(quantity);
    const sellPriceValue = parseFloat(sellPrice);

    if (sellQuantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (sellQuantity > investment.quantity) {
      toast({
        title: "Error",
        description: `Cannot sell more than ${investment.quantity} shares`,
        variant: "destructive",
      });
      return;
    }

    if (sellPriceValue <= 0) {
      toast({
        title: "Error",
        description: "Sell price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (!sellDate) {
        toast({
          title: "Error",
          description: "Please select a sell date",
          variant: "destructive",
        });
        return;
      }

      await sellInvestment({
        investmentId: investment.id,
        quantity: sellQuantity,
        sellPrice: sellPriceValue,
        sellDate: sellDate,
      });

      toast({
        title: "Success",
        description: "Investment sale recorded successfully",
      });

      // Reset form
      setQuantity("");
      setSellPrice("");
      setSellDate(new Date());
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record sale",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate estimated gain/loss
  const estimatedGain = quantity && sellPrice
    ? (parseFloat(sellPrice) - investment.purchasePrice) * parseFloat(quantity)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sell {investment.name} {investment.symbol && `(${investment.symbol})`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Available Quantity:</span>
              <span className="font-semibold">{investment.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Purchase Price:</span>
              <span className="font-semibold">${investment.purchasePrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Sell</Label>
            <Input
              id="quantity"
              type="number"
              step="0.0001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Max: ${investment.quantity}`}
              required
              min="0.0001"
              max={investment.quantity}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellPrice">Sell Price per Share</Label>
            <Input
              id="sellPrice"
              type="number"
              step="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="Enter sell price"
              required
              min="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellDate">Sell Date</Label>
            <DatePicker
              date={sellDate}
              onDateChange={(date) => setSellDate(date)}
              placeholder="Select sell date"
            />
          </div>

          {quantity && sellPrice && (
            <div className="bg-blue-50 p-3 rounded-md space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sale Value:</span>
                <span className="font-semibold">
                  ${(parseFloat(quantity) * parseFloat(sellPrice)).toFixed(2)}
                </span>
              </div>
              <div className={`flex justify-between ${estimatedGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                <span>Estimated Gain/Loss:</span>
                <span className="font-semibold">
                  {estimatedGain >= 0 ? "+" : ""}${estimatedGain.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

