"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ClosedPosition {
  id: string;
  investment: {
    id: string;
    name: string;
    symbol: string | null;
    type: string;
    purchasePrice: number;
  };
  quantity: number;
  sellPrice: number;
  sellDate: Date | string;
  realizedGain: number;
}

interface ClosedPositionsListProps {
  profileId?: string | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function ClosedPositionsList({ profileId, activeTab = "usd", onTabChange }: ClosedPositionsListProps) {
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [allClosedPositions, setAllClosedPositions] = useState<ClosedPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClosedPositions() {
      try {
        const response = await fetch(`/api/investments/closed-positions?profileId=${profileId || ""}`);
        if (response.ok) {
          const data = await response.json();
          setAllClosedPositions(data.sales || []);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching closed positions:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    if (profileId) {
      fetchClosedPositions();
    } else {
      setLoading(false);
    }
  }, [profileId]);

  // Filter closed positions based on active tab
  useEffect(() => {
    if (activeTab === "canadian") {
      // Filter for Canadian stocks
      const filtered = allClosedPositions.filter((pos) => {
        const symbol = (pos.investment.symbol || "").toUpperCase();
        return symbol.includes(".TO") || 
               symbol.includes(".V") || 
               symbol.includes("TSX");
      });
      setClosedPositions(filtered);
    } else if (activeTab === "usd") {
      // Filter for USD/US stocks
      const filtered = allClosedPositions.filter((pos) => {
        const symbol = (pos.investment.symbol || "").toUpperCase();
        const isCanadian = symbol.includes(".TO") || 
                          symbol.includes(".V") || 
                          symbol.includes("TSX");
        return !isCanadian;
      });
      setClosedPositions(filtered);
    } else {
      setClosedPositions(allClosedPositions);
    }
  }, [activeTab, allClosedPositions]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading closed positions...</p>
        </CardContent>
      </Card>
    );
  }

  if (allClosedPositions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Closed Positions</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No closed positions found.</p>
        </CardContent>
      </Card>
    );
  }

  const totalRealizedGain = closedPositions.reduce((sum, pos) => sum + pos.realizedGain, 0);
  const totalSoldValue = closedPositions.reduce((sum, pos) => sum + (pos.sellPrice * pos.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange || (() => {})} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="usd">USD Market</TabsTrigger>
          <TabsTrigger value="canadian">Canadian Market/Stocks</TabsTrigger>
        </TabsList>

        <TabsContent value="usd" className="mt-6">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Realized Gain</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${totalRealizedGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(totalRealizedGain, "CAD")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Total Gain</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Sell Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(totalSoldValue, "CAD")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Total Value Sold</p>
                </CardContent>
              </Card>
            </div>

            {/* Closed Positions Table */}
            {closedPositions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Closed Positions - USD Market</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Investment</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Purchase Price</TableHead>
                          <TableHead>Sell Price</TableHead>
                          <TableHead>Sell Date</TableHead>
                          <TableHead className="text-right">Realized Gain/Loss</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {closedPositions.map((position) => (
                          <TableRow key={position.id}>
                            <TableCell className="font-medium">
                              {position.investment.name}
                              {position.investment.symbol && (
                                <span className="text-muted-foreground ml-2">({position.investment.symbol})</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{position.investment.type}</Badge>
                            </TableCell>
                            <TableCell>{position.quantity}</TableCell>
                            <TableCell>{formatCurrency(position.investment.purchasePrice, "CAD")}</TableCell>
                            <TableCell>{formatCurrency(position.sellPrice, "CAD")}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(position.sellDate).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`flex items-center justify-end gap-1 ${
                                position.realizedGain >= 0 ? "text-green-600" : "text-red-600"
                              }`}>
                                {position.realizedGain >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                <span className="font-semibold">
                                  {formatCurrency(position.realizedGain, "CAD")}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No closed positions found for USD Market.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="canadian" className="mt-6">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Realized Gain</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${totalRealizedGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(totalRealizedGain, "CAD")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Total Gain</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Sell Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(totalSoldValue, "CAD")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Total Value Sold</p>
                </CardContent>
              </Card>
            </div>

            {/* Closed Positions Table */}
            {closedPositions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Closed Positions - Canadian Market</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Investment</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Purchase Price</TableHead>
                          <TableHead>Sell Price</TableHead>
                          <TableHead>Sell Date</TableHead>
                          <TableHead className="text-right">Realized Gain/Loss</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {closedPositions.map((position) => (
                          <TableRow key={position.id}>
                            <TableCell className="font-medium">
                              {position.investment.name}
                              {position.investment.symbol && (
                                <span className="text-muted-foreground ml-2">({position.investment.symbol})</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{position.investment.type}</Badge>
                            </TableCell>
                            <TableCell>{position.quantity}</TableCell>
                            <TableCell>{formatCurrency(position.investment.purchasePrice, "CAD")}</TableCell>
                            <TableCell>{formatCurrency(position.sellPrice, "CAD")}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(position.sellDate).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`flex items-center justify-end gap-1 ${
                                position.realizedGain >= 0 ? "text-green-600" : "text-red-600"
                              }`}>
                                {position.realizedGain >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                <span className="font-semibold">
                                  {formatCurrency(position.realizedGain, "CAD")}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No closed positions found for Canadian Market.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

