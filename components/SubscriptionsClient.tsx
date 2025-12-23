"use client";

import { useRouter } from "next/navigation";
import { SubscriptionList } from "@/components/SubscriptionList";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { startTransition } from "react";

interface SubscriptionsClientProps {
  initialData: {
    subscriptions: any[];
    categories: any[];
    accounts: any[];
  };
}

export function SubscriptionsClient({ initialData }: SubscriptionsClientProps) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions & Bills</h1>
          <SubscriptionForm 
            categories={initialData.categories}
            accounts={initialData.accounts}
            onSuccess={() => {
              startTransition(() => {
                router.refresh();
              });
            }}
          />
        </div>
        <SubscriptionList 
          subscriptions={initialData.subscriptions} 
          categories={initialData.categories}
          accounts={initialData.accounts}
        />
      </div>
    </div>
  );
}

