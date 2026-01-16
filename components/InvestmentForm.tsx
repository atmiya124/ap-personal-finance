"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X, Loader2, RefreshCw } from "lucide-react";
import { createInvestment, updateInvestment } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/DatePicker";

interface Investment {
  id: string;
  name: string;
  type: string;
  symbol: string | null;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Date | string;
  strategy?: string | null;
  target?: number | null;
}

interface InvestmentFormProps {
  investment?: Investment;
  onCancel?: () => void;
  onSuccess?: () => void;
  profileId?: string;
  activeTab?: string;
}

export function InvestmentForm({ investment, onCancel, onSuccess, profileId, activeTab }: InvestmentFormProps) {
  const [isOpen, setIsOpen] = useState(!!investment);
  
  // Open dialog when investment is provided (for editing)
  useEffect(() => {
    if (investment) {
      setIsOpen(true);
    }
  }, [investment]);
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const { toast } = useToast();
  const [name, setName] = useState(investment?.name || "");
  const [type, setType] = useState(investment?.type || "stock");
  const [symbol, setSymbol] = useState(investment?.symbol || "");
  const [quantity, setQuantity] = useState(investment?.quantity.toString() || "");
  const [purchasePrice, setPurchasePrice] = useState(investment?.purchasePrice.toString() || "");
  const [currentPrice, setCurrentPrice] = useState(investment?.currentPrice.toString() || "");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    investment?.purchaseDate
      ? typeof investment.purchaseDate === "string"
        ? new Date(investment.purchaseDate)
        : investment.purchaseDate
      : new Date()
  );
  const [strategy, setStrategy] = useState(investment?.strategy || "");
  const [target, setTarget] = useState(investment?.target?.toString() || "");
  const symbolTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCurrentPrice = useCallback(async (symbolValue: string, typeValue: string) => {
    if (!symbolValue || !typeValue) return;

    setFetchingPrice(true);
    try {
      const response = await fetch(
        `/api/investments/quote?symbol=${encodeURIComponent(symbolValue)}&type=${encodeURIComponent(typeValue)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch price");
      }

      const data = await response.json();
      if (data.price) {
        setCurrentPrice(data.price.toFixed(2));
        // Auto-fill company name from API response
        if (data.name) {
          setName(data.name);
        } else if (data.symbol) {
          // Fallback to symbol if name not available
          setName(data.symbol);
        }
        toast({
          title: "Price Updated",
          description: `Current price: ${data.price.toFixed(2)} ${data.currency || ""}`,
        });
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching price:", error);
      }
      toast({
        title: "Price Fetch Failed",
        description: error.message || "Could not fetch current price. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setFetchingPrice(false);
    }
  }, [toast]);

  // Auto-fetch price when symbol changes (with debounce)
  useEffect(() => {
    if (symbolTimeoutRef.current) {
      clearTimeout(symbolTimeoutRef.current);
    }

    if (symbol && type && (type === "stock" || type === "crypto")) {
      symbolTimeoutRef.current = setTimeout(() => {
        fetchCurrentPrice(symbol, type);
      }, 1000); // Wait 1 second after user stops typing
    }

    return () => {
      if (symbolTimeoutRef.current) {
        clearTimeout(symbolTimeoutRef.current);
      }
    };
  }, [symbol, type, fetchCurrentPrice]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && !investment) {
      // Reset form when dialog closes
      setName("");
      setType("stock");
      setSymbol("");
      setQuantity("");
      setPurchasePrice("");
      setCurrentPrice("");
      setPurchaseDate(new Date());
      setStrategy("");
      setTarget("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!purchaseDate) {
        toast({
          title: "Error",
          description: "Please select a purchase date",
          variant: "destructive",
        });
        return;
      }

      if (!symbol || !symbol.trim()) {
        toast({
          title: "Error",
          description: "Symbol is required",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Ensure name is set (should be auto-fetched, but fallback to symbol if not)
      const finalName = name || symbol.trim();

      // Auto-append .TO suffix for Canadian stocks if in Canadian Market tab
      let finalSymbol = symbol.trim().toUpperCase();
      if (activeTab === "canadian" && type === "stock" && !investment) {
        // Only for new investments (not editing)
        const hasCanadianSuffix = finalSymbol.includes(".TO") || 
                                  finalSymbol.includes(".V") || 
                                  finalSymbol.includes("TSX");
        if (!hasCanadianSuffix) {
          finalSymbol = finalSymbol + ".TO";
        }
      }

      const data = {
        name: finalName,
        type,
        symbol: finalSymbol,
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        currentPrice: parseFloat(currentPrice),
        purchaseDate: purchaseDate,
        strategy: strategy || null,
        target: target ? parseFloat(target) : null,
        profileId: profileId && profileId !== "all" && profileId !== "none" ? profileId : null,
      };

      if (investment) {
        await updateInvestment(investment.id, data);
        toast({
          title: "Success",
          description: "Investment updated successfully",
        });
      } else {
        await createInvestment(data);
        toast({
          title: "Success",
          description: "Investment created successfully",
        });
      }

      setIsOpen(false);
      if (onSuccess) onSuccess();
      if (!investment) {
        setName("");
        setType("stock");
        setSymbol("");
        setQuantity("");
        setPurchasePrice("");
        setCurrentPrice("");
        setPurchaseDate(new Date());
        setStrategy("");
        setTarget("");
      } else {
        // Keep the name when editing (it was auto-fetched)
      }
    } catch (error: any) {
      const errorMessage = error?.message || (investment ? "Failed to update investment" : "Failed to create investment");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      if (process.env.NODE_ENV === "development") {
        console.error("Investment form error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render form content (shared between dialog and card views)
  const formContent = (
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
        <Label htmlFor="symbol">Symbol *</Label>
        <div className="flex gap-2">
              <Input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., AAPL, BTC"
            className="flex-1"
            required
          />
          {symbol && (type === "stock" || type === "crypto") && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fetchCurrentPrice(symbol, type)}
              disabled={fetchingPrice}
              title="Fetch current price"
            >
              {fetchingPrice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
        {fetchingPrice && (
          <p className="text-xs text-gray-500">Fetching current price...</p>
        )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.0001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPrice">Current Price</Label>
                <Input
                  id="currentPrice"
                  type="number"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  required
                />
              </div>
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
          <Label htmlFor="purchaseDate">Buy Date</Label>
          <DatePicker
            date={purchaseDate}
            onDateChange={(date) => setPurchaseDate(date)}
            placeholder="Select buy date"
              />
            </div>
            <div className="space-y-2">
          <Label htmlFor="strategy">Strategy</Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger id="strategy">
              <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
              <SelectItem value="Long Term Growth">Long Term Growth</SelectItem>
              <SelectItem value="Dividend Growth">Dividend Growth</SelectItem>
              <SelectItem value="Index Tracking">Index Tracking</SelectItem>
              <SelectItem value="Growth Play">Growth Play</SelectItem>
              <SelectItem value="Tech Sector">Tech Sector</SelectItem>
              <SelectItem value="Value Investing">Value Investing</SelectItem>
              <SelectItem value="Dividend Income">Dividend Income</SelectItem>
              <SelectItem value="Swing Trading">Swing Trading</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
        <Label htmlFor="target">Target Price (Optional)</Label>
            <Input
          id="target"
                type="number"
                step="0.01"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="e.g., 210.00"
            />
          </div>

      <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {investment ? "Update" : "Create"}
            </Button>
        <Button type="button" variant="outline" onClick={() => {
          handleOpenChange(false);
          if (onCancel) onCancel();
        }} disabled={loading}>
                Cancel
              </Button>
          </div>
        </form>
  );

  // If no investment (adding new), show dialog with trigger button
  if (!investment) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Add Investment
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  // If investment exists (editing), show in dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open && onCancel) {
        onCancel();
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Investment</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
