"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import { Edit, Trash2, MoreVertical, CheckCircle2, Copy, History, Loader2, Search, Power, PowerOff } from "lucide-react";
import { SubscriptionForm } from "./SubscriptionForm";
import { deleteSubscription, toggleSubscriptionActive, duplicateSubscription, getSubscriptionPayments } from "@/app/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface Subscription {
  id: string;
  name: string;
  type: string;
  amount: number;
  frequency: string;
  dueDate: number | null;
  isActive: boolean;
  category: Category | null;
  payments: Array<{
    id: string;
    paidDate: Date | string;
    isPaid: boolean;
  }>;
}

interface Account {
  id: string;
  name: string;
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
  categories: Category[];
  accounts: Account[];
}

export function SubscriptionList({
  subscriptions: initialSubscriptions,
  categories,
  accounts,
}: SubscriptionListProps) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);

  useEffect(() => {
    setSubscriptions(initialSubscriptions);
  }, [initialSubscriptions]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const { toast } = useToast();

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
  const isOverdue = (dueDate: number | null, isActive: boolean): boolean => {
    if (!isActive || !dueDate) return false;
    const today = new Date();
    const due = new Date(today.getFullYear(), today.getMonth(), dueDate);
    return due < today;
  };

  const handleDeleteClick = (id: string) => {
    setSubscriptionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subscriptionToDelete) return;
    
    try {
      await deleteSubscription(subscriptionToDelete);
      setSubscriptions(subscriptions.filter((s) => s.id !== subscriptionToDelete));
      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
    }
  };

  const handleMarkPaid = async (subscriptionId: string) => {
    setLoadingActions((prev) => new Set(prev).add(subscriptionId));
    try {
      const subscription = subscriptions.find((s) => s.id === subscriptionId);
      const paymentStatus = subscription ? isPaidForCurrentPeriod(subscription) : { isPaid: false, paymentId: undefined };
      
      const formData = new FormData();
      formData.append("subscriptionId", subscriptionId);
      if (paymentStatus.paymentId) {
        formData.append("paymentId", paymentStatus.paymentId);
      }
      const { markSubscriptionPaid } = await import("@/app/actions");
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
      setLoadingActions((prev) => {
        const next = new Set(prev);
        next.delete(subscriptionId);
        return next;
      });
    }
  };

  const handleToggleActive = async (subscriptionId: string) => {
    setLoadingActions((prev) => new Set(prev).add(subscriptionId));
    try {
      await toggleSubscriptionActive(subscriptionId);
      setSubscriptions(subscriptions.map((s) => 
        s.id === subscriptionId ? { ...s, isActive: !s.isActive } : s
      ));
      toast({
        title: "Success",
        description: "Subscription status updated",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription status",
        variant: "destructive",
      });
    } finally {
      setLoadingActions((prev) => {
        const next = new Set(prev);
        next.delete(subscriptionId);
        return next;
      });
    }
  };

  const handleDuplicate = async (subscriptionId: string) => {
    setLoadingActions((prev) => new Set(prev).add(subscriptionId));
    try {
      await duplicateSubscription(subscriptionId);
      toast({
        title: "Success",
        description: "Subscription duplicated successfully",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate subscription",
        variant: "destructive",
      });
    } finally {
      setLoadingActions((prev) => {
        const next = new Set(prev);
        next.delete(subscriptionId);
        return next;
      });
    }
  };

  const handleViewPaymentHistory = async (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setPaymentHistoryOpen(true);
    setLoadingPaymentHistory(true);
    try {
      const payments = await getSubscriptionPayments(subscriptionId);
      setPaymentHistory(payments);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive",
      });
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  const activeSubscriptions = subscriptions.filter((s) => s.isActive);
  const monthlyTotal = activeSubscriptions
    .filter((s) => s.frequency === "monthly")
    .reduce((sum, s) => sum + s.amount, 0);

  const yearlyTotal = activeSubscriptions
    .filter((s) => s.frequency === "yearly")
    .reduce((sum, s) => sum + s.amount / 12, 0);

  const totalMonthly = monthlyTotal + yearlyTotal;

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((sub) =>
        statusFilter === "active" ? sub.isActive : !sub.isActive
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (sub) => sub.category?.id === categoryFilter
      );
    }

    // Sort subscriptions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "amount":
          return b.amount - a.amount; // Descending (highest first)
        case "renewalDate":
          // Sort by due date (nulls last)
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate - b.dueDate;
        default:
          return 0;
      }
    });

    return filtered;
  }, [subscriptions, searchQuery, statusFilter, categoryFilter, sortBy]);

  /**
   * Format renewal date
   * 
   * How renewal dates work:
   * - dueDate is stored as a number (1-31) representing the day of the month
   * - For monthly subscriptions: Shows the next occurrence of that day
   * - If today is March 20 and dueDate is 15, it shows "April 15, 2025" (next month)
   * - If today is March 10 and dueDate is 15, it shows "March 15, 2025" (this month)
   * - For yearly subscriptions: Same logic but calculates yearly
   */
  const formatRenewalDate = (dueDate: number | null): string => {
    if (!dueDate) return "N/A";
    const today = new Date();
    let due = new Date(today.getFullYear(), today.getMonth(), dueDate);
    
    // If the date has passed this month, show next month's date
    if (due < today) {
      due = new Date(today.getFullYear(), today.getMonth() + 1, dueDate);
    }
    
    return due.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  // Get renewal status text and color
  const getRenewalStatus = (
    subscription: Subscription
  ): { text: string; color: string; isOverdue: boolean } => {
    const { isPaid } = isPaidForCurrentPeriod(subscription);
    const overdue = isOverdue(subscription.dueDate, subscription.isActive);
    
    if (!subscription.isActive) {
      if (!subscription.dueDate) return { text: "Expired", color: "text-red-600", isOverdue: false };
      const today = new Date();
      const due = new Date(today.getFullYear(), today.getMonth(), subscription.dueDate);
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        return { text: `Expired ${diffDays} day${diffDays > 1 ? 's' : ''} ago`, color: "text-red-600", isOverdue: false };
      }
    }
    
    // If overdue and not paid
    if (overdue && !isPaid) {
      const today = new Date();
      const due = new Date(today.getFullYear(), today.getMonth(), subscription.dueDate!);
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { 
        text: `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`, 
        color: "text-red-600",
        isOverdue: true
      };
    }
    
    // If paid for current period
    if (isPaid) {
      if (!subscription.dueDate) return { text: "Paid", color: "text-green-600", isOverdue: false };
      
      // Calculate next renewal date
      const today = new Date();
      let due = new Date(today.getFullYear(), today.getMonth(), subscription.dueDate);
      
      // If the date has passed this month, check next month
      if (due < today) {
        due = new Date(today.getFullYear(), today.getMonth() + 1, subscription.dueDate);
      }
      
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return { text: "Paid - Renews today", color: "text-green-600", isOverdue: false };
      }
      
      return { 
        text: `Paid - Next: ${diffDays} day${diffDays > 1 ? 's' : ''}`, 
        color: "text-green-600",
        isOverdue: false
      };
    }
    
    if (!subscription.dueDate) return { text: "No renewal date", color: "text-gray-600", isOverdue: false };
    
    const today = new Date();
    let due = new Date(today.getFullYear(), today.getMonth(), subscription.dueDate);
    
    // If the date has passed this month, check next month
    if (due < today) {
      due = new Date(today.getFullYear(), today.getMonth() + 1, subscription.dueDate);
    }
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { text: "Due today", color: "text-orange-600", isOverdue: false };
    }
    
    return { text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: "text-blue-600", isOverdue: false };
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Total Monthly Subscriptions</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalMonthly)}
            </p>
          </CardContent>
        </Card>

        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="amount">Sort by Amount</SelectItem>
                  <SelectItem value="renewalDate">Sort by Renewal Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            {filteredAndSortedSubscriptions.length !== subscriptions.length && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredAndSortedSubscriptions.length} of {subscriptions.length} subscriptions
              </div>
            )}
          </CardContent>
        </Card>

        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No subscriptions yet</p>
            </CardContent>
          </Card>
        ) : filteredAndSortedSubscriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No subscriptions match your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedSubscriptions.map((subscription) => {

              const paymentStatus = isPaidForCurrentPeriod(subscription);
              const renewalStatus = getRenewalStatus(subscription);
              const renewalDate = formatRenewalDate(subscription.dueDate);
              const frequencyText = subscription.frequency === "monthly" ? "/month" : subscription.frequency === "yearly" ? "/year" : subscription.frequency === "weekly" ? "/week" : "";

              return (
                <Card key={subscription.id} className="relative">
                  <CardContent className="pt-6">
                    {/* Menu Icon */}
                    <div className="absolute top-4 right-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loadingActions.has(subscription.id)}>
                            {loadingActions.has(subscription.id) ? (
                              <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!paymentStatus.isPaid && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(subscription.id)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {paymentStatus.isPaid && (
                            <DropdownMenuItem disabled>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Already Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleActive(subscription.id)}>
                            {subscription.isActive ? (
                              <>
                                <span className="w-4 h-4 mr-2">⏸</span>
                                Deactivate
                              </>
                            ) : (
                              <>
                                <span className="w-4 h-4 mr-2">▶</span>
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewPaymentHistory(subscription.id)}>
                            <History className="w-4 h-4 mr-2" />
                            View Payment History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(subscription.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate Subscription
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setEditingId(subscription.id);
                            setEditDialogOpen(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(subscription.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Title and Status */}
                    <div className="flex items-start justify-between mb-4 pr-8">
                      <h3 
                        className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => {
                          setEditingId(subscription.id);
                          setEditDialogOpen(true);
                        }}
                        title="Click to edit"
                      >
                        {subscription.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(subscription.id)}
                          disabled={loadingActions.has(subscription.id)}
                          title={subscription.isActive ? "Deactivate" : "Activate"}
                        >
                          {loadingActions.has(subscription.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : subscription.isActive ? (
                            <Power className="w-4 h-4 text-green-600" />
                          ) : (
                            <PowerOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <Badge 
                          variant={subscription.isActive ? "default" : "destructive"}
                          className={
                            subscription.isActive 
                              ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200 cursor-pointer"
                              : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200 cursor-pointer"
                          }
                          onClick={() => handleToggleActive(subscription.id)}
                        >
                          {subscription.isActive ? "Active" : "Expired"}
                        </Badge>
                      </div>
                    </div>

                    {/* Amount */}
                    <p className="text-2xl font-bold text-gray-900 mb-3">
                      {formatCurrency(subscription.amount)}{frequencyText}
                    </p>

                    {/* Renewal Date */}
                    <p className="text-sm text-gray-600 mb-2">{renewalDate}</p>

                    {/* Renewal Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${renewalStatus.color}`}>
                          {renewalStatus.text}
                        </p>
                        {paymentStatus.isPaid && (
                          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs">
                            Paid
                          </Badge>
                        )}
                        {renewalStatus.isOverdue && !paymentStatus.isPaid && (
                          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPaymentHistory(subscription.id)}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        <History className="w-3 h-3 mr-1" />
                        History
                      </Button>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-4">
                      {paymentStatus.isPaid ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="flex-1 bg-gray-100 text-gray-500 cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Already Paid
                        </Button>
                      ) : (
                        <Button
                          variant={renewalStatus.isOverdue ? "default" : "default"}
                          size="sm"
                          onClick={() => handleMarkPaid(subscription.id)}
                          disabled={loadingActions.has(subscription.id)}
                          className={`flex-1 ${
                            renewalStatus.isOverdue 
                              ? "bg-red-600 hover:bg-red-700 text-white" 
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          {loadingActions.has(subscription.id) ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          )}
                          {renewalStatus.isOverdue ? "Mark Paid (Overdue)" : "Mark Paid"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(subscription.id);
                          setEditDialogOpen(true);
                        }}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Subscription"
        description="Are you sure you want to delete this subscription? This action cannot be undone."
      />

      {/* Edit Dialog */}
      {editingId && (
        <SubscriptionForm
          categories={categories}
          accounts={accounts}
          subscription={filteredAndSortedSubscriptions.find((s) => s.id === editingId)}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setEditingId(null);
            }
          }}
          onCancel={() => {
            setEditDialogOpen(false);
            setEditingId(null);
          }}
          onSuccess={() => {
            setEditDialogOpen(false);
            setEditingId(null);
            startTransition(() => {
              router.refresh();
            });
          }}
        />
      )}

      {/* Payment History Dialog */}
      <Dialog open={paymentHistoryOpen} onOpenChange={setPaymentHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
          </DialogHeader>
          {loadingPaymentHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No payment history available</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.paidDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant={payment.isPaid ? "default" : "outline"}>
                    {payment.isPaid ? "Paid" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
