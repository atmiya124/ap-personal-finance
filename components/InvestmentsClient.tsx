"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { InvestmentList } from "@/components/InvestmentList";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentProfileSelector } from "@/components/InvestmentProfileSelector";
import { ClosedPositionsList } from "@/components/ClosedPositionsList";
import { startTransition, Suspense, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface InvestmentsClientProps {
  initialData: {
    investments: any[];
    profiles: any[];
    defaultProfileId?: string | null;
  };
}

function InvestmentsContent({ initialData }: InvestmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  let currentProfileId = searchParams.get("profile");
  const [showClosedPositions, setShowClosedPositions] = useState(false);
  const [activeTab, setActiveTab] = useState("usd");
  const [closedPositionsTab, setClosedPositionsTab] = useState("usd");
  
  // If no profile in URL but we have a default, redirect to it
  useEffect(() => {
    if (!currentProfileId && initialData.defaultProfileId) {
      router.replace(`/investments?profile=${initialData.defaultProfileId}`);
    }
  }, [currentProfileId, initialData.defaultProfileId, router]);
  
  const hasProfiles = Array.isArray(initialData.profiles) && initialData.profiles.length > 0;
  const isProfileSelected = currentProfileId && currentProfileId !== "all" && currentProfileId !== "none";

  // Filter investments based on active tab
  const filteredInvestments = useMemo(() => {
    if (activeTab === "canadian") {
      // Filter for Canadian stocks - stocks with .TO suffix or TSX exchange indicators
      return initialData.investments.filter((inv: any) => {
        if (inv.type !== "stock") return false;
        const symbol = (inv.symbol || "").toUpperCase();
        // Check for Canadian stock indicators: .TO, .V (TSX Venture), or common TSX patterns
        return symbol.includes(".TO") || 
               symbol.includes(".V") || 
               symbol.includes("TSX") ||
               // You can add more Canadian stock identification logic here
               false;
      });
    }
    if (activeTab === "usd") {
      // Filter for USD/US stocks - stocks without Canadian indicators
      return initialData.investments.filter((inv: any) => {
        if (inv.type !== "stock") return false;
        const symbol = (inv.symbol || "").toUpperCase();
        // Exclude Canadian stocks
        const isCanadian = symbol.includes(".TO") || 
                          symbol.includes(".V") || 
                          symbol.includes("TSX");
        return !isCanadian;
      });
    }
    // Default - show all investments (non-stocks and stocks)
    return initialData.investments;
  }, [initialData.investments, activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Investments</h1>
        </div>
        <Suspense fallback={<div>Loading profiles...</div>}>
          <InvestmentProfileSelector
            profiles={initialData.profiles}
            currentProfileId={currentProfileId}
          />
        </Suspense>
        {!hasProfiles ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-medium mb-2">No Investment Profiles</p>
            <p className="text-yellow-700 text-sm mb-4">
              Create your first investment profile to start tracking investments.
            </p>
            <p className="text-yellow-600 text-xs">
              Click &quot;New Profile&quot; above to create one.
            </p>
          </div>
        ) : !isProfileSelected ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800 font-medium mb-2">Select an Investment Profile</p>
            <p className="text-blue-700 text-sm">
              Please select a profile from the dropdown above to view or add investments.
            </p>
          </div>
        ) : showClosedPositions ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowClosedPositions(false)}
              >
                ← Back
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Closed Positions</h2>
            </div>
            <ClosedPositionsList 
              profileId={currentProfileId} 
              activeTab={closedPositionsTab}
              onTabChange={setClosedPositionsTab}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="usd">USD Market</TabsTrigger>
                <TabsTrigger value="canadian">Canadian Market/Stocks</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-3">
                {isProfileSelected && (
                  <Button
                    variant={showClosedPositions ? "default" : "outline"}
                    onClick={() => setShowClosedPositions(!showClosedPositions)}
                  >
                    Closed Positions
                  </Button>
                )}
                {isProfileSelected ? (
          <InvestmentForm 
                    profileId={currentProfileId || undefined}
            onSuccess={() => {
              startTransition(() => {
                router.refresh();
              });
            }}
          />
                ) : (
                  <div className="text-sm text-gray-500">
                    Please select a profile to add investments
                  </div>
                )}
              </div>
            </div>
            <TabsContent value="usd" className="mt-6">
              {filteredInvestments.length > 0 ? (
                <InvestmentList investments={filteredInvestments} />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-800 font-medium mb-2">No USD Market Stocks Found</p>
                  <p className="text-gray-600 text-sm">
                    USD market stocks are identified by symbols without .TO or .V suffixes.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="canadian" className="mt-6">
              {filteredInvestments.length > 0 ? (
                <InvestmentList investments={filteredInvestments} />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-800 font-medium mb-2">No Canadian Stocks Found</p>
                  <p className="text-gray-600 text-sm">
                    Canadian stocks are identified by symbols ending with .TO or .V (TSX exchange).
                  </p>
        </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export function InvestmentsClient({ initialData }: InvestmentsClientProps) {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-8">Loading...</div>}>
      <InvestmentsContent initialData={initialData} />
    </Suspense>
  );
}

