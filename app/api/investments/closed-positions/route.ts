import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Build where clause for sales
    const salesWhere: any = { userId };
    
    // If profileId is provided, filter by profileId stored in sale record
    if (profileId && profileId !== "all" && profileId !== "none") {
      salesWhere.profileId = profileId;
    }
    
    // Get all sales for the user (filtered by profileId if provided)
    let sales = await prisma.investmentSale.findMany({
      where: salesWhere,
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

    // Use stored investment data if investment relation is null (investment was deleted)
    sales = sales.map((sale) => ({
      ...sale,
      investment: sale.investment || {
        id: sale.investmentId,
        name: sale.investmentName || "Unknown",
        symbol: sale.investmentSymbol,
        type: sale.investmentType || "stock",
        purchasePrice: sale.purchasePrice || 0,
      },
    }));

    return NextResponse.json({ sales });
  } catch (error: any) {
    console.error("Error fetching closed positions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch closed positions" },
      { status: 500 }
    );
  }
}

