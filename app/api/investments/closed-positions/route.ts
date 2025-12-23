import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get("profileId");

    // Build where clause
    const where: any = { userId };

    // If profileId is provided, we need to filter by investments that belong to that profile
    // Since InvestmentSale doesn't have profileId directly, we need to join through Investment
    let sales;
    
    if (profileId && profileId !== "all" && profileId !== "none") {
      // Get investments for this profile first
      const profileInvestments = await prisma.investment.findMany({
        where: {
          userId,
          profileId: profileId,
        },
        select: { id: true },
      });

      const investmentIds = profileInvestments.map((inv) => inv.id);

      if (investmentIds.length === 0) {
        return NextResponse.json({ sales: [] });
      }

      sales = await prisma.investmentSale.findMany({
        where: {
          userId,
          investmentId: { in: investmentIds },
        },
        include: {
          investment: {
            select: {
              id: true,
              name: true,
              symbol: true,
              type: true,
              purchasePrice: true,
            },
          },
        },
        orderBy: { sellDate: "desc" },
      });
    } else {
      // Get all sales for the user
      sales = await prisma.investmentSale.findMany({
        where,
        include: {
          investment: {
            select: {
              id: true,
              name: true,
              symbol: true,
              type: true,
              purchasePrice: true,
            },
          },
        },
        orderBy: { sellDate: "desc" },
      });
    }

    // Filter out sales where investment was deleted (shouldn't happen due to cascade, but be safe)
    sales = sales.filter((sale) => sale.investment !== null);

    return NextResponse.json({ sales });
  } catch (error: any) {
    console.error("Error fetching closed positions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch closed positions" },
      { status: 500 }
    );
  }
}

