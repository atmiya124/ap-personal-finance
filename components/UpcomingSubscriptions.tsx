"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { MoreVertical, Film, Music, Cloud, Dumbbell, Tv, Gamepad2, ShoppingBag, CreditCard, Wifi, CheckCircle2, Loader2 } from "lucide-react";
import { markSubscriptionPaid } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  dueDate: number | null;
  type: string;
  isActive: boolean;
  payments: Array<{
    id: string;
    paidDate: Date | string;
    isPaid: boolean;
  }>;
}

interface UpcomingSubscriptionsProps {
  subscriptions: Subscription[];
}

export function UpcomingSubscriptions({ subscriptions }: UpcomingSubscriptionsProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  // Check if subscription is paid for current period
  const isPaidForCurrentPeriod = (subscription: Subscription): { isPaid: boolean; paymentId?: string } => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Find payment for current month/year
    const currentPayment = subscription.payments.find((p) => {
      const paidDate = typeof p.paidDate === "string" ? new Date(p.paidDate) : p.paidDate;
      return (
        paidDate.getMonth() === currentMonth &&
        paidDate.getFullYear() === currentYear &&
        p.isPaid
      );
    });
    
    return {
      isPaid: !!currentPayment,
      paymentId: currentPayment?.id,
    };
  };

  // Check if subscription is overdue
  const isOverdue = (dueDate: number | null): boolean => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(today.getFullYear(), today.getMonth(), dueDate);
    return due < today;
  };

  const monthlySubscriptions = subscriptions.filter((sub) => sub.frequency === "monthly");

  const subscriptionsWithStatus = monthlySubscriptions.map((sub) => {
    const paymentStatus = isPaidForCurrentPeriod(sub);
    const overdue = isOverdue(sub.dueDate);
    
    return {
      ...sub,
      ...paymentStatus,
      isOverdue: overdue && !paymentStatus.isPaid,
    };
  });

  const totalMonthly = subscriptionsWithStatus.reduce((sum, sub) => sum + sub.amount, 0);

  const handleMarkPaid = async (subscriptionId: string) => {
    setLoadingIds((prev) => new Set(prev).add(subscriptionId));
    try {
      const subscription = subscriptions.find((s) => s.id === subscriptionId);
      const paymentStatus = subscription ? isPaidForCurrentPeriod(subscription) : { isPaid: false, paymentId: undefined };
      
      const formData = new FormData();
      formData.append("subscriptionId", subscriptionId);
      if (paymentStatus.paymentId) {
        formData.append("paymentId", paymentStatus.paymentId);
      }
      await markSubscriptionPaid(formData);
      toast({
        title: "Success",
        description: paymentStatus.isPaid ? "Payment updated" : "Subscription marked as paid",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark subscription as paid",
        variant: "destructive",
      });
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(subscriptionId);
        return next;
      });
    }
  };

  // Get subscription icon based on name or type
  const getSubscriptionIcon = (name: string, type: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("netflix") || nameLower.includes("streaming") || nameLower.includes("video")) {
      return <Film className="w-6 h-6 text-purple-600" />;
    }
    if (nameLower.includes("spotify") || nameLower.includes("music") || nameLower.includes("audio")) {
      return <Music className="w-6 h-6 text-purple-600" />;
    }
    if (nameLower.includes("cloud") || nameLower.includes("storage") || nameLower.includes("drive")) {
      return <Cloud className="w-6 h-6 text-purple-400" />;
    }
    if (nameLower.includes("gym") || nameLower.includes("fitness") || nameLower.includes("workout")) {
      return <Dumbbell className="w-6 h-6 text-yellow-500" />;
    }
    if (nameLower.includes("tv") || nameLower.includes("cable")) {
      return <Tv className="w-6 h-6 text-purple-600" />;
    }
    if (nameLower.includes("game") || nameLower.includes("gaming")) {
      return <Gamepad2 className="w-6 h-6 text-purple-600" />;
    }
    if (nameLower.includes("shopping") || nameLower.includes("amazon") || nameLower.includes("prime")) {
      return <ShoppingBag className="w-6 h-6 text-purple-600" />;
    }
    if (nameLower.includes("credit") || nameLower.includes("card")) {
      return <CreditCard className="w-6 h-6 text-purple-600" />;
    }
    if (nameLower.includes("internet") || nameLower.includes("wifi")) {
      return <Wifi className="w-6 h-6 text-purple-600" />;
    }
    // Default icon
    return <CreditCard className="w-6 h-6 text-purple-600" />;
  };

  // Calculate days until due date and get status
  const getStatusInfo = (
    subscription: typeof subscriptionsWithStatus[0]
  ): { text: string; color: "default" | "secondary" | "destructive" | "outline" } => {
    const { isPaid, isOverdue, dueDate } = subscription;
    
    // If paid, show days until next payment
    if (isPaid) {
      if (!dueDate) return { text: "Paid", color: "outline" };
      
      // Calculate next renewal date
      const today = new Date();
      let due = new Date(today.getFullYear(), today.getMonth(), dueDate);
      
      // If the date has passed this month, check next month
      if (due < today) {
        due = new Date(today.getFullYear(), today.getMonth() + 1, dueDate);
      }
      
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return { text: "in 0d", color: "outline" };
      }
      
      return { text: `in ${diffDays}d`, color: "outline" };
    }
    
    // If overdue and not paid
    if (isOverdue) {
      const today = new Date();
      const due = new Date(today.getFullYear(), today.getMonth(), dueDate!);
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { text: `Overdue ${diffDays}d`, color: "destructive" };
    }
    
    if (!dueDate) return { text: "N/A", color: "outline" };
    
    const today = new Date();
    let due = new Date(today.getFullYear(), today.getMonth(), dueDate);
    
    // If the date has passed this month, check next month
    if (due < today) {
      due = new Date(today.getFullYear(), today.getMonth() + 1, dueDate);
    }
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { text: "Today", color: "secondary" };
    }
    
    return { text: `In ${diffDays}d`, color: "default" };
  };

  const formatDueDate = (dueDate: number | null): string => {
    if (!dueDate) return "N/A";
    const today = new Date();
    let due = new Date(today.getFullYear(), today.getMonth(), dueDate);
    
    // If the date has passed this month, show next month's date
    if (due < today) {
      due = new Date(today.getFullYear(), today.getMonth() + 1, dueDate);
    }
    
    return due.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Subscriptions</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {subscriptionsWithStatus.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active subscriptions</p>
          ) : (
            subscriptionsWithStatus.slice(0, 5).map((subscription) => {
              const statusInfo = getStatusInfo(subscription);
              const dueDateFormatted = formatDueDate(subscription.dueDate);
              const frequencyText = subscription.frequency === "monthly" ? "/month" : subscription.frequency === "yearly" ? "/year" : subscription.frequency === "weekly" ? "/week" : "";
              
              return (
                <div
                  key={subscription.id}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getSubscriptionIcon(subscription.name, subscription.type)}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-1">{subscription.name}</p>
                    <p className="text-sm text-gray-600 mb-1">{dueDateFormatted}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(subscription.amount)}{frequencyText}
                      </p>
                      {subscription.isPaid && (
                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs">
                          Paid
                        </Badge>
                      )}
                      {subscription.isOverdue && (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Badge and Action */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <Badge 
                      variant={statusInfo.color}
                      className={
                        statusInfo.color === "destructive" 
                          ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                          : statusInfo.color === "secondary"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200"
                      }
                    >
                      {statusInfo.text}
                    </Badge>
                    {!subscription.isPaid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkPaid(subscription.id)}
                        disabled={loadingIds.has(subscription.id)}
                        className="h-8 px-2"
                        title="Mark as paid"
                      >
                        {loadingIds.has(subscription.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className={`w-4 h-4 ${subscription.isOverdue ? 'text-red-600' : 'text-green-600'}`} />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
