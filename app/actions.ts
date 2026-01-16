"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/get-user-id";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  getUserFriendlyError,
} from "@/lib/errors";

export async function markSubscriptionPaid(formData: FormData) {
  const userId = await getUserId();
  if (!userId) {
    throw new AuthenticationError();
  }

  const subscriptionId = formData.get("subscriptionId") as string;
  const paymentId = formData.get("paymentId") as string;
  const accountId = formData.get("accountId") as string | null; // Optional account ID

  // Get subscription details
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { category: true },
  });

  if (!subscription) {
    throw new NotFoundError("Subscription");
  }

  const paidDate = new Date();
  let createdPayment;

  if (paymentId) {
    // Update existing payment
    await prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: { isPaid: true },
    });
  } else {
    // Create new payment
    createdPayment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId,
        amount: subscription.amount,
        paidDate,
        isPaid: true,
      },
    });

    // Create expense transaction when marking as paid (only for new payments)
    // Use provided accountId, subscription's accountId, or first account
    let targetAccountId = accountId || subscription.accountId;
    if (!targetAccountId) {
      const firstAccount = await prisma.account.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      if (!firstAccount) {
        throw new NotFoundError("Account. Please create an account first");
      }
      targetAccountId = firstAccount.id;
    }

    // Verify account exists (we don't need the account object for atomic operations)
    const accountExists = await prisma.account.findUnique({ 
      where: { id: targetAccountId },
      select: { id: true },
    });
    if (!accountExists) {
      throw new NotFoundError("Account");
    }

    // Get or create "Subscription" category
    let subscriptionCategoryId = subscription.categoryId;
    if (!subscriptionCategoryId) {
      // Try to find existing "Subscription" category
      let subscriptionCategory = await prisma.category.findFirst({
        where: {
          userId,
          name: "Subscription",
          type: "expense",
        },
      });

      // If not found, create it
      if (!subscriptionCategory) {
        subscriptionCategory = await prisma.category.create({
          data: {
            name: "Subscription",
            type: "expense",
            color: "#8B5CF6", // Purple color for subscriptions
            userId,
          },
        });
      }
      subscriptionCategoryId = subscriptionCategory.id;
    }

    // Create expense transaction
    await prisma.transaction.create({
      data: {
        type: "expense",
        amount: subscription.amount,
        description: subscription.name, // Use subscription name as description/note
        payee: subscription.name, // Use subscription name as payee
        date: paidDate,
        accountId: targetAccountId,
        categoryId: subscriptionCategoryId, // Use subscription category or "Subscription" category
        userId,
      },
    });

    // Update account balance (deduct expense) - atomic operation
    await prisma.account.update({
      where: { id: targetAccountId },
      data: { balance: { decrement: subscription.amount } },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath("/transactions");
}

export async function createTransaction(data: {
  type: string;
  amount: number;
  description?: string;
  payee?: string;
  date: Date;
  accountId: string;
  categoryId?: string | null;
}) {
  const userId = await getUserId();
  if (!userId) throw new AuthenticationError();

  if (!data.accountId) {
    throw new ValidationError("Please select an account");
  }

  if (!data.amount || data.amount <= 0) {
    throw new ValidationError("Amount must be greater than 0");
  }

  // Verify account exists (we don't need the account object for atomic operations)
  const accountExists = await prisma.account.findUnique({ 
    where: { id: data.accountId },
    select: { id: true },
  });
  if (!accountExists) {
    throw new NotFoundError("Account");
  }

  await prisma.transaction.create({
    data: {
      ...data,
      userId,
      description: data.description || null,
      payee: data.payee || null,
    },
  });

  // Update account balance - atomic operation to prevent race conditions
  if (data.type === "income") {
    await prisma.account.update({
      where: { id: data.accountId },
      data: { balance: { increment: data.amount } },
    });
  } else {
    await prisma.account.update({
      where: { id: data.accountId },
      data: { balance: { decrement: data.amount } },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function updateTransaction(
  id: string,
  data: {
    type: string;
    amount: number;
    description?: string;
    payee?: string;
    date: Date;
    accountId: string;
    categoryId?: string | null;
  }
) {
  if (!data.accountId) {
    throw new Error("Account ID is required");
  }

  if (!data.amount || data.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const oldTransaction = await prisma.transaction.findUnique({ where: { id } });
  if (!oldTransaction) {
    throw new Error("Transaction not found");
  }

  // Verify new account exists (we don't need the account object for atomic operations)
  const newAccountExists = await prisma.account.findUnique({ 
    where: { id: data.accountId },
    select: { id: true },
  });
  if (!newAccountExists) {
    throw new NotFoundError("Account");
  }
  
  await prisma.transaction.update({
    where: { id },
    data: {
      ...data,
      description: data.description || null,
      payee: data.payee || null,
    },
  });

  // Update account balances - atomic operations to prevent race conditions
  // Reverse the old transaction's effect on the old account (if account changed)
  if (oldTransaction.accountId && oldTransaction.accountId !== data.accountId) {
    if (oldTransaction.type === "income") {
      await prisma.account.update({
        where: { id: oldTransaction.accountId },
        data: { balance: { decrement: oldTransaction.amount } },
      });
    } else {
      await prisma.account.update({
        where: { id: oldTransaction.accountId },
        data: { balance: { increment: oldTransaction.amount } },
      });
    }
  } else if (oldTransaction.accountId === data.accountId) {
    // Same account: need to reverse old transaction and apply new one
    const oldBalanceChange = oldTransaction.type === "income" 
      ? oldTransaction.amount 
      : -oldTransaction.amount;
    const newBalanceChange = data.type === "income" ? data.amount : -data.amount;
    const netChange = newBalanceChange - oldBalanceChange;
    
    if (netChange > 0) {
      await prisma.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: netChange } },
      });
    } else if (netChange < 0) {
      await prisma.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: Math.abs(netChange) } },
      });
    }
    // If netChange is 0, no update needed
    
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return; // Early return to avoid double update
  }

  // Apply the new transaction's effect on the new account
  if (data.type === "income") {
    await prisma.account.update({
      where: { id: data.accountId },
      data: { balance: { increment: data.amount } },
    });
  } else {
    await prisma.account.update({
      where: { id: data.accountId },
      data: { balance: { decrement: data.amount } },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function deleteTransaction(id: string) {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  
  if (transaction) {
    await prisma.transaction.delete({ where: { id } });

    // Update account balance - atomic operation to reverse transaction effect
    if (transaction.type === "income") {
      await prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { decrement: transaction.amount } },
      });
    } else {
      await prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: transaction.amount } },
      });
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function createAccount(data: {
  name: string;
  type: string;
  balance: number;
  currency: string;
}) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  await prisma.account.create({
    data: {
      ...data,
      userId,
    },
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function updateAccount(
  id: string,
  data: {
    name: string;
    type: string;
    balance: number;
    currency: string;
  }
) {
  await prisma.account.update({
    where: { id },
    data,
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function deleteAccount(id: string) {
  await prisma.account.delete({ where: { id } });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function createCategory(data: {
  name: string;
  type: string;
  icon: string | null;
  color: string;
}) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.category.create({
    data: {
      ...data,
      userId,
    },
  });

  revalidatePath("/categories");
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    type: string;
    icon: string | null;
    color: string;
  }
) {
  await prisma.category.update({
    where: { id },
    data,
  });

  revalidatePath("/categories");
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
}

export async function createInvestment(data: {
  name: string;
  type: string;
  symbol: string | null;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Date;
  strategy?: string | null;
  target?: number | null;
  profileId?: string | null;
}) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.investment.create({
    data: {
      ...data,
      userId,
      profileId: data.profileId || null,
    },
  });

  revalidatePath("/investments");
}

export async function updateInvestment(
  id: string,
  data: {
    name: string;
    type: string;
    symbol: string | null;
    quantity: number;
    purchasePrice: number;
    currentPrice: number;
    purchaseDate: Date;
    strategy?: string | null;
    target?: number | null;
    profileId?: string | null;
  }
) {
  const userId = await getUserId();
  if (!userId) throw new AuthenticationError();

  // Validate required fields
  if (!data.name || !data.type || !data.symbol) {
    throw new ValidationError("Name, type, and symbol are required");
  }

  if (data.quantity <= 0 || data.purchasePrice <= 0 || data.currentPrice <= 0) {
    throw new ValidationError("Quantity and prices must be greater than 0");
  }

  // Verify the investment exists and belongs to the user
  const investment = await prisma.investment.findUnique({
    where: { id },
    select: { id: true, userId: true, profileId: true, symbol: true },
  });

  if (!investment) {
    throw new NotFoundError("Investment not found");
  }

  if (investment.userId !== userId) {
    throw new AuthenticationError("You don't have permission to update this investment");
  }

  // Determine the profileId to use
  // If profileId is explicitly provided (including null), use it
  // Otherwise, preserve the existing profileId
  // Note: We check if profileId is in the data object to determine if it was explicitly set
  let finalProfileId: string | null;
  if (data.profileId !== undefined) {
    // Explicitly provided (could be null or a string)
    finalProfileId = data.profileId;
  } else {
    // Not provided, preserve existing
    finalProfileId = investment.profileId;
  }

  // If profileId is provided, verify it exists and belongs to the user
  if (finalProfileId) {
    const profile = await prisma.investmentProfile.findUnique({
      where: { id: finalProfileId },
      select: { id: true, userId: true },
    });

    if (!profile) {
      throw new NotFoundError("Investment profile not found");
    }

    if (profile.userId !== userId) {
      throw new AuthenticationError("You don't have permission to use this investment profile");
    }
  }

  try {
    const updated = await prisma.investment.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        symbol: data.symbol,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        currentPrice: data.currentPrice,
        purchaseDate: data.purchaseDate,
        strategy: data.strategy || null,
        target: data.target || null,
        profileId: finalProfileId,
      },
    });

    revalidatePath("/investments");
    return updated;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating investment:", error);
    }
    throw new DatabaseError(`Failed to update investment: ${error.message || "Unknown error"}`);
  }
}

export async function deleteInvestment(id: string) {
  const userId = await getUserId();
  if (!userId) throw new AuthenticationError();

  // Verify the investment exists and belongs to the user
  const investment = await prisma.investment.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!investment) {
    throw new NotFoundError("Investment");
  }

  if (investment.userId !== userId) {
    throw new AuthenticationError("You don't have permission to delete this investment");
  }

  await prisma.investment.delete({ where: { id } });
  revalidatePath("/investments");
}

export async function sellInvestment(data: {
  investmentId: string;
  quantity: number;
  sellPrice: number;
  sellDate: Date;
}) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  // Get the investment
  const investment = await prisma.investment.findUnique({
    where: { id: data.investmentId },
  });

  if (!investment) {
    throw new Error("Investment not found");
  }

  if (data.quantity > investment.quantity) {
    throw new Error(`Cannot sell more than ${investment.quantity} shares`);
  }

  // Calculate realized gain/loss
  const realizedGain = (data.sellPrice - investment.purchasePrice) * data.quantity;

  // Create the sale record
  await prisma.investmentSale.create({
    data: {
      investmentId: data.investmentId,
      quantity: data.quantity,
      sellPrice: data.sellPrice,
      sellDate: data.sellDate,
      realizedGain,
      userId,
    },
  });

  // Update investment quantity (reduce by sold amount)
  const newQuantity = investment.quantity - data.quantity;

  if (newQuantity <= 0) {
    // If all shares are sold, delete the investment
    await prisma.investment.delete({ where: { id: data.investmentId } });
  } else {
    // Update quantity
    await prisma.investment.update({
      where: { id: data.investmentId },
      data: { quantity: newQuantity },
    });
  }

  revalidatePath("/investments");
}

export async function getInvestmentSales(investmentId?: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const where: any = { userId };
  if (investmentId) {
    where.investmentId = investmentId;
  }

  const sales = await prisma.investmentSale.findMany({
    where,
    include: {
      investment: {
        select: {
          name: true,
          symbol: true,
        },
      },
    },
    orderBy: { sellDate: "desc" },
  });

  return sales;
}

// Investment Profile Actions
export async function createInvestmentProfile(name: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  try {
    const prismaClient = prisma as any;
    if (!prismaClient.investmentProfile) {
      throw new Error("InvestmentProfile model not available. Please run: npx prisma generate");
    }

    // If this is the first profile, make it default
    const existingProfiles = await prismaClient.investmentProfile.findMany({
      where: { userId },
    });

    const isDefault = existingProfiles.length === 0;

    const newProfile = await prismaClient.investmentProfile.create({
      data: {
        name,
        userId,
        isDefault,
      },
    });

    revalidatePath("/investments");
    
    return newProfile;
  } catch (error: any) {
    throw new Error(`Failed to create profile: ${error.message}. Please ensure Prisma client is regenerated.`);
  }
}

export async function getInvestmentProfiles() {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  try {
    const prismaClient = prisma as any;
    if (!prismaClient.investmentProfile) {
      return [];
    }
    const profiles = await prismaClient.investmentProfile.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return profiles;
  } catch (error) {
    return [];
  }
}

export async function deleteInvestmentProfile(id: string) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    const prismaClient = prisma as any;
    if (!prismaClient.investmentProfile) {
      throw new Error("InvestmentProfile model not available");
    }

    // Check if it's the default profile
    const profile = await prismaClient.investmentProfile.findUnique({
      where: { id },
    });

    if (profile?.isDefault) {
      // Find another profile to make default
      const otherProfile = await prismaClient.investmentProfile.findFirst({
        where: {
          userId,
          id: { not: id },
        },
      });

      if (otherProfile) {
        await prismaClient.investmentProfile.update({
          where: { id: otherProfile.id },
          data: { isDefault: true },
        });
      }
    }

    // Set investments to null profile (they'll be shown in "All" view)
    try {
      await prisma.investment.updateMany({
        where: { profileId: id },
        data: { profileId: null },
      });
    } catch (e) {
      // If profileId field doesn't exist, skip this step
    }

    await prismaClient.investmentProfile.delete({ where: { id } });
    revalidatePath("/investments");
  } catch (error: any) {
    throw new Error(`Failed to delete profile: ${error.message}`);
  }
}

export async function setDefaultInvestmentProfile(id: string) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    const prismaClient = prisma as any;
    if (!prismaClient.investmentProfile) {
      throw new Error("InvestmentProfile model not available");
    }

    // Unset all other defaults
    await prismaClient.investmentProfile.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set this one as default
    await prismaClient.investmentProfile.update({
      where: { id },
      data: { isDefault: true },
    });

    revalidatePath("/investments");
  } catch (error: any) {
    throw new Error(`Failed to set default profile: ${error.message}`);
  }
}

export async function createSubscription(data: {
  name: string;
  type: string;
  amount: number;
  frequency: string;
  dueDate: number | null;
  categoryId: string | null;
  accountId: string | null;
  isActive: boolean;
}) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  await prisma.subscription.create({
    data: {
      ...data,
      userId,
    },
  });

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function updateSubscription(
  id: string,
  data: {
    name: string;
    type: string;
    amount: number;
    frequency: string;
    dueDate: number | null;
    categoryId: string | null;
    accountId: string | null;
    isActive: boolean;
  }
) {
  await prisma.subscription.update({
    where: { id },
    data,
  });

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function deleteSubscription(id: string) {
  await prisma.subscription.delete({ where: { id } });
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function toggleSubscriptionActive(id: string) {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) throw new Error("Subscription not found");
  
  await prisma.subscription.update({
    where: { id },
    data: { isActive: !subscription.isActive },
  });

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function duplicateSubscription(id: string) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) throw new Error("Subscription not found");

  await prisma.subscription.create({
    data: {
      name: `${subscription.name} (Copy)`,
      type: subscription.type,
      amount: subscription.amount,
      frequency: subscription.frequency,
      dueDate: subscription.dueDate,
      categoryId: subscription.categoryId,
      isActive: subscription.isActive,
      userId,
    },
  });

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function getSubscriptionPayments(subscriptionId: string) {
  const payments = await prisma.subscriptionPayment.findMany({
    where: { subscriptionId },
    orderBy: { paidDate: "desc" },
  });
  return payments;
}

export async function updateUser(data: {
  name: string;
  email: string;
  currency: string;
  dateFormat: string;
}) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  revalidatePath("/settings");
}

export async function exportData(format: "csv" | "json") {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      transactions: {
        include: { account: true, category: true },
      },
      categories: true,
      investments: true,
      subscriptions: {
        include: { category: true, payments: true },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return { user, format };
}

// Tax Record Actions
export async function createTaxRecord(data: {
  financialYear: string;
  totalIncome: number;
  totalDeductions: number;
  regime: string;
  calculatedTax: number;
  effectiveRate: number;
  previousYearTax?: number | null;
  salary: number;
  otherIncome: number;
  capitalGains: number;
  standardDeduction: number;
  taxSavingInvestments: number;
  healthInsurance: number;
}) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    const prismaClient = prisma as any;
    if (!prismaClient.taxRecord) {
      throw new Error("TaxRecord model not available. Please run: npx prisma generate");
    }

    const record = await prismaClient.taxRecord.create({
      data: {
        ...data,
        userId,
      },
    });

    revalidatePath("/tax");
    return record;
  } catch (error: any) {
    throw new Error(`Failed to create tax record: ${error.message}`);
  }
}

export async function updateTaxRecord(
  id: string,
  data: {
    financialYear: string;
    totalIncome: number;
    totalDeductions: number;
    regime: string;
    calculatedTax: number;
    effectiveRate: number;
    previousYearTax?: number | null;
    salary: number;
    otherIncome: number;
    capitalGains: number;
    standardDeduction: number;
    taxSavingInvestments: number;
    healthInsurance: number;
  }
) {
  try {
    const prismaClient = prisma as any;
    if (!prismaClient.taxRecord) {
      throw new Error("TaxRecord model not available");
    }

    await prismaClient.taxRecord.update({
      where: { id },
      data,
    });

    revalidatePath("/tax");
  } catch (error: any) {
    throw new Error(`Failed to update tax record: ${error.message}`);
  }
}
