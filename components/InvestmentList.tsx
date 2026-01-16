"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import { Edit, Trash2, TrendingUp, TrendingDown, RefreshCw, Loader2, DollarSign, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvestmentForm } from "./InvestmentForm";
import { InvestmentSaleForm } from "./InvestmentSaleForm";
import { deleteInvestment, updateInvestment } from "@/app/actions";
import { InvestmentChart } from "./InvestmentChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

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

interface InvestmentListProps {
  investments: Investment[];
}

interface InvestmentLogo {
  [key: string]: string | null;
}

export function InvestmentList({ investments: initialInvestments }: InvestmentListProps) {
  const router = useRouter();
  const [investments, setInvestments] = useState(initialInvestments);
  const investmentsRef = useRef(investments);
  const [logos, setLogos] = useState<InvestmentLogo>({});
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [refreshingLogos, setRefreshingLogos] = useState<Set<string>>(new Set());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [sellingInvestment, setSellingInvestment] = useState<Investment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLogo = useCallback(async (symbol: string, type: string) => {
    // Skip if already failed or currently fetching
    if (refreshingLogos.has(symbol) || failedLogos.has(symbol)) return;
    
    setRefreshingLogos((prev) => new Set(prev).add(symbol));
    try {
      const response = await fetch(
        `/api/investments/logo?symbol=${encodeURIComponent(symbol)}&type=${encodeURIComponent(type)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.logo) {
          setLogos((prev) => ({ ...prev, [symbol]: data.logo }));
        } else {
          // Mark as failed if no logo returned
          setFailedLogos((prev) => new Set(prev).add(symbol));
        }
      } else {
        setFailedLogos((prev) => new Set(prev).add(symbol));
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching logo:", error);
      }
      setFailedLogos((prev) => new Set(prev).add(symbol));
    } finally {
      setRefreshingLogos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(symbol);
        return newSet;
      });
    }
  }, [refreshingLogos, failedLogos]);

  useEffect(() => {
    setInvestments(initialInvestments);
    investmentsRef.current = initialInvestments;
    // Fetch logos for all investments with symbols
    initialInvestments.forEach((inv) => {
      if (inv.symbol && !logos[inv.symbol] && !failedLogos.has(inv.symbol)) {
        fetchLogo(inv.symbol, inv.type);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInvestments, fetchLogo]);

  // Auto-refresh prices every 5 seconds
  useEffect(() => {
    const refreshPrices = async () => {
      // Get current investments from ref (always has latest data)
      const currentInvestments = investmentsRef.current;
      const investmentsWithSymbols = currentInvestments.filter(
        (inv) => inv.symbol && (inv.type === "stock" || inv.type === "crypto")
      );

      if (investmentsWithSymbols.length === 0) return;

      try {
        const updates = await Promise.all(
          investmentsWithSymbols.map(async (inv) => {
            try {
              const response = await fetch(
                `/api/investments/quote?symbol=${encodeURIComponent(inv.symbol!)}&type=${encodeURIComponent(inv.type)}`
              );

              if (response.ok) {
                const data = await response.json();
                if (data.price && Math.abs(data.price - inv.currentPrice) > 0.01) {
                  // Only update if price changed significantly (more than 1 cent)
                  return {
                    id: inv.id,
                    currentPrice: data.price,
                  };
                }
              }
            } catch (error) {
              // Silently fail for individual price fetches
              if (process.env.NODE_ENV === "development") {
                console.error(`Error fetching price for ${inv.symbol}:`, error);
              }
            }
            return null;
          })
        );

        const validUpdates = updates.filter(
          (u): u is { id: string; currentPrice: number } => u !== null
        );

        if (validUpdates.length > 0) {
          await Promise.all(
            validUpdates.map((update) => {
              const investment = currentInvestments.find((i) => i.id === update.id)!;
              return updateInvestment(update.id, {
                ...investment,
                currentPrice: update.currentPrice,
                purchaseDate:
                  typeof investment.purchaseDate === "string"
                    ? new Date(investment.purchaseDate)
                    : investment.purchaseDate,
              });
            })
          );

          // Refresh the page data after updates
          startTransition(() => {
            router.refresh();
          });
        }
      } catch (error) {
        // Silently fail for auto-refresh to avoid spamming console
        if (process.env.NODE_ENV === "development") {
          console.error("Error in auto-refresh:", error);
        }
      }
    };

    // Set up interval to refresh every 5 seconds
    const interval = setInterval(() => {
      refreshPrices();
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [router]);

  const refreshAllPrices = async () => {
    setRefreshingPrices(true);
    try {
      const updates = await Promise.all(
        investments.map(async (inv) => {
          if (!inv.symbol || (inv.type !== "stock" && inv.type !== "crypto")) {
            return null;
          }

          try {
            const response = await fetch(
              `/api/investments/quote?symbol=${encodeURIComponent(inv.symbol)}&type=${encodeURIComponent(inv.type)}`
            );

            if (response.ok) {
              const data = await response.json();
              if (data.price && data.price !== inv.currentPrice) {
                return {
                  id: inv.id,
                  currentPrice: data.price,
                };
              }
            }
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              console.error(`Error fetching price for ${inv.symbol}:`, error);
            }
          }
          return null;
        })
      );

      const validUpdates = updates.filter((u): u is { id: string; currentPrice: number } => u !== null);

      if (validUpdates.length > 0) {
        await Promise.all(
          validUpdates.map((update) => {
            const investment = investments.find((i) => i.id === update.id)!;
            return updateInvestment(update.id, {
              name: investment.name,
              type: investment.type,
              symbol: investment.symbol,
              quantity: investment.quantity,
              purchasePrice: investment.purchasePrice,
              currentPrice: update.currentPrice,
              purchaseDate: typeof investment.purchaseDate === "string" 
                ? new Date(investment.purchaseDate) 
                : investment.purchaseDate,
              strategy: investment.strategy || null,
              target: investment.target || null,
              profileId: (investment as any).profileId || null,
            });
          })
        );

        toast({
          title: "Prices Updated",
          description: `Updated ${validUpdates.length} investment price(s)`,
        });

        startTransition(() => {
          router.refresh();
        });
      } else {
        toast({
          title: "No Updates",
          description: "All prices are already up to date",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh prices",
        variant: "destructive",
      });
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setInvestmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!investmentToDelete) return;
    
    try {
      await deleteInvestment(investmentToDelete);
      setInvestments(investments.filter((i) => i.id !== investmentToDelete));
      toast({
        title: "Success",
        description: "Investment deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete investment",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setInvestmentToDelete(null);
    }
  };

  const totalValue = investments.reduce(
    (sum, inv) => sum + inv.quantity * inv.currentPrice,
    0
  );
  const totalCost = investments.reduce(
    (sum, inv) => sum + inv.quantity * inv.purchasePrice,
    0
  );
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              </CardContent>
            </Card>
            <Card className={`col-span-2 ${totalGain >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Gain/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {totalGain >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`text-2xl font-bold ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(totalGain)} ({totalGainPercent.toFixed(2)}%)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-1">
            <InvestmentChart investments={investments} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stock Holdings</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAllPrices}
                disabled={refreshingPrices}
              >
                {refreshingPrices ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Prices
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#e2e2e2]/30">
                  <TableRow className="[&>th:first-child]:rounded-tl-lg [&>th:last-child]:rounded-tr-lg [&>th:first-child]:rounded-bl-lg [&>th:last-child]:rounded-br-lg">
                    <TableHead>Stock</TableHead>
                    <TableHead>Buy Date</TableHead>
                    <TableHead className="text-right">Buy Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Buy Value</TableHead>
                    <TableHead className="text-right">CMP</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Gain</TableHead>
                    <TableHead className="text-right">% Gain</TableHead>
                    <TableHead className="text-right">Days</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Target Value</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {investments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center text-gray-500">
                      No investments yet
                    </TableCell>
                  </TableRow>
                ) : (
                    investments.map((investment) => {
                      const buyValue = investment.quantity * investment.purchasePrice;
                      const currentValue = investment.quantity * investment.currentPrice;
                      const gain = currentValue - buyValue;
                      const gainPercent = buyValue > 0 ? (gain / buyValue) * 100 : 0;
                      const buyDate = typeof investment.purchaseDate === "string" 
                        ? new Date(investment.purchaseDate) 
                        : investment.purchaseDate;
                      const days = Math.floor((new Date().getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
                      const targetValue = investment.target ? investment.quantity * investment.target : null;
                      const logoUrl = investment.symbol ? logos[investment.symbol] : null;
                      const isTargetReached = investment.target ? investment.currentPrice >= investment.target : false;

                      return (
                        <TableRow 
                          key={investment.id}
                          className={isTargetReached ? "bg-green-50/50" : ""}
                        >
                          <TableCell className={isTargetReached ? "rounded-l-lg" : ""}>
                            <div className="flex items-center gap-3">
                              {investment.symbol && (
                                <div className={`relative w-10 h-10 rounded-full overflow-hidden border flex-shrink-0 flex items-center justify-center ${
                                  gain >= 0 
                                    ? "bg-green-50 border-green-200" 
                                    : "bg-red-50 border-red-200"
                                }`}>
                                  {logoUrl && !failedLogos.has(investment.symbol) ? (
                                    <Image
                                      src={logoUrl}
                                      alt={`${investment.symbol} logo`}
                                      fill
                                      className="object-contain p-1"
                                      unoptimized
                                      onError={() => {
                                        setLogos((prev) => {
                                          const newLogos = { ...prev };
                                          delete newLogos[investment.symbol!];
                                          return newLogos;
                                        });
                                        setFailedLogos((prev) => new Set(prev).add(investment.symbol!));
                                      }}
                                    />
                                  ) : refreshingLogos.has(investment.symbol) ? (
                                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${
                                      gain >= 0 ? "bg-green-100" : "bg-red-100"
                                    }`}>
                                      <span className={`text-xs font-semibold ${
                                        gain >= 0 ? "text-green-700" : "text-red-700"
                                      }`}>
                                        {investment.symbol.substring(0, 2).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-semibold text-blue-600">
                                  {investment.name}
                                </span>
                                {investment.symbol && (
                                  <span className="text-xs text-muted-foreground">
                                    ({investment.symbol})
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {buyDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(investment.purchasePrice, "CAD")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              className="bg-blue-50 text-blue-600 border border-blue-200"
                            >
                              {investment.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(buyValue, "CAD")}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(investment.currentPrice, "CAD")}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(currentValue, "CAD")}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            gain >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {gain >= 0 ? "+" : ""}{formatCurrency(gain, "CAD")}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            gain >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {gain >= 0 ? "+" : ""}{gainPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right">{days}</TableCell>
                          <TableCell>{investment.strategy || "-"}</TableCell>
                          <TableCell className="text-right">
                            {investment.target ? formatCurrency(investment.target, "CAD") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {targetValue ? formatCurrency(targetValue, "CAD") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {investment.target ? (
                              (() => {
                                const remainingPercent = ((investment.target - investment.currentPrice) / investment.target) * 100;
                                return isTargetReached ? (
                                  <Badge className="bg-green-600 text-white">
                                    Target Reached
                                  </Badge>
                                ) : (
                                  <span>{remainingPercent.toFixed(2)}%</span>
                                );
                              })()
                            ) : "-"}
                          </TableCell>
                          <TableCell className={`text-center ${isTargetReached ? "rounded-r-lg" : ""}`}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setSellingInvestment(investment)}
                                  className="text-green-600"
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Sell
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingInvestment(investment);
                                    setEditingId(investment.id);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Update
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(investment.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Investment"
        description="Are you sure you want to delete this investment? This action cannot be undone."
      />

      {editingInvestment && (
        <InvestmentForm
          investment={editingInvestment}
          onCancel={() => {
            setEditingInvestment(null);
            setEditingId(null);
          }}
          onSuccess={() => {
            setEditingInvestment(null);
            setEditingId(null);
            startTransition(() => {
              router.refresh();
            });
          }}
        />
      )}

      {sellingInvestment && (
        <InvestmentSaleForm
          investment={sellingInvestment}
          open={!!sellingInvestment}
          onOpenChange={(open) => {
            if (!open) setSellingInvestment(null);
          }}
          onSuccess={() => {
            setSellingInvestment(null);
            startTransition(() => {
              router.refresh();
            });
          }}
        />
      )}
    </>
  );
}
