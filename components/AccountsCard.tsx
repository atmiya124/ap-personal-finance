"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Settings, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { AccountForm } from "./AccountForm";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface AccountsCardProps {
  accounts: Account[];
}

export function AccountsCard({ accounts }: AccountsCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddAccount, setShowAddAccount] = useState(false);

  const accountTypeMap: Record<string, string> = {
    bank: "Bank Account",
    savings: "Savings",
    credit_card: "Credit Card",
    investment: "Investment",
    wallet: "Wallet",
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? accounts.length - 1 : prev - 1));
  };

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === accounts.length - 1 ? 0 : prev + 1));
  }, [accounts.length]);

  // Auto-advance every 8 seconds
  useEffect(() => {
    if (accounts.length <= 1) return; // Don't auto-advance if there's only one or no accounts

    const interval = setInterval(() => {
      handleNext();
    }, 5000); // 8 seconds

    return () => clearInterval(interval);
  }, [accounts.length, handleNext]);

  const currentAccount = accounts.length > 0 ? accounts[currentIndex] : null;

  // Different background styles for each account card
  const cardStyles = [
    "bg-gradient-to-br from-[#1a4133] to-[#0d2818] shadow-xl shadow-emerald-900/20",
    "bg-gradient-to-br from-[#1e3a5f] to-[#0f1f3a] shadow-xl shadow-blue-900/20",
    "bg-gradient-to-br from-[#4a1e5c] to-[#2d0f3a] shadow-xl shadow-purple-900/20",
    "bg-gradient-to-br from-[#5c3a1e] to-[#3a2d0f] shadow-xl shadow-amber-900/20",
    "bg-gradient-to-br from-[#1e5c3a] to-[#0f3a2d] shadow-xl shadow-teal-900/20",
    "bg-gradient-to-br from-[#5c1e3a] to-[#3a0f2d] shadow-xl shadow-rose-900/20",
  ];

  const getCardStyle = (index: number) => {
    return cardStyles[index % cardStyles.length];
  };

  return (
    <>
      <Card>
        {/* Header Section */}
        <CardHeader className="space-y-1.5 p-6 flex flex-row items-center justify-between pb-5">
          <CardTitle className="text-lg font-semibold text-gray-900">My Accounts</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddAccount(true)}
            className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-white rounded-2xl shadow-xs mt-0"
          >
            <Settings className="w-4 h-4 mr-1" />
            Manage
          </Button>
        </CardHeader>

        {/* Account Card */}
        {currentAccount ? (
          <CardContent className="p-6 pt-0">
            <Card className={`mb-5 relative w-full aspect-[2.5/1] rounded-2xl overflow-hidden ${getCardStyle(currentIndex)} text-white transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  {/* Top Left - Four Dots Icon */}
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-2 h-2 rounded-full bg-white/70"></div>
                    <div className="w-2 h-2 rounded-full bg-white/40"></div>
                    <div className="w-2 h-2 rounded-full bg-white/40"></div>
                    <div className="w-2 h-2 rounded-full bg-white/70"></div>
                  </div>
                  
                  {/* Top Right - Wi-Fi Icon */}
                  <Wifi className="w-5 h-5 text-white/80 rotate-90" />
                </div>

                {/* Account Balance Section */}
                <div className="absolute bottom-5 left-6">
                  <p className="text-xs font-light opacity-80 mb-1">Account Balance</p>
                  <p className="text-3xl font-bold tracking-tight">
                    {formatCurrency(currentAccount.balance, currentAccount.currency)}
                  </p>
                </div>

                {/* Account Name (replaces TYPE) */}
                <div className="flex items-start gap-8 absolute bottom-6 right-6">
                  <div>
                    <p className="block text-[10px] opacity-60">NAME</p>
                    <p className="text-base font-medium text-white">
                      {currentAccount.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 w-10 h-10 rounded-2xl shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {accounts.map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-3xl transition-all duration-200 ${
                      index === currentIndex
                        ? "w-5 h-2 bg-blue-600 shadow-sm"
                        : "w-2 h-2 bg-gray-300 opacity-50"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 w-10 h-10 rounded-2xl shadow-xs"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        ) : (
          <Card className="bg-gradient-to-br from-teal-700 to-teal-900 text-white border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-white/80">No accounts yet. Add your first account to get started.</p>
            </CardContent>
          </Card>
        )}
      </Card>

      <AccountForm
        open={showAddAccount}
        onOpenChange={setShowAddAccount}
        onSuccess={() => {
          setShowAddAccount(false);
          // Refresh will be handled by parent
        }}
      />
    </>
  );
}

