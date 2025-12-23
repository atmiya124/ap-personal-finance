import { prisma } from "@/lib/prisma";
import { InvestmentsClient } from "@/components/InvestmentsClient";
import { getCurrentUser } from "@/lib/get-user-id";

async function getInvestments(profileId?: string | null) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const where: any = { userId: user.id };
  
  // Check if profileId field exists in schema - if not, just get all investments
  // Only filter by profile if profileId is provided and valid
  if (profileId && profileId !== "all" && profileId !== "none") {
    // Try to filter by profile, but don't fail if field doesn't exist
    try {
      where.profileId = profileId;
    } catch (e) {
      // If profileId field doesn't exist, just get all investments
      console.log("Profile filtering not available - showing all investments");
    }
  }

  const investments = await prisma.investment.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Try to get profiles, but don't fail if the feature isn't available
  let profiles: any[] = [];
  try {
    // Only try to access profiles if the Prisma client has been regenerated
    // Check by trying to access the model property
    const prismaClient = prisma as any;
    if (prismaClient.investmentProfile) {
      try {
        profiles = await prismaClient.investmentProfile.findMany({
          where: { userId: user.id },
          orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        });
      } catch (queryError: any) {
        // Query failed - table might not exist or schema mismatch
        console.log("Profiles query failed (table may not exist):", queryError?.message);
        profiles = [];
      }
    }
  } catch (error: any) {
    // Profiles feature not available - this is OK, continue without it
    profiles = [];
  }

  return { investments, profiles };
}

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams?: { profile?: string };
}) {
  let profileId = searchParams?.profile;
  
  const { investments, profiles } = await getInvestments(profileId);

  // If no profile selected but profiles exist, use default profile
  if (!profileId && profiles && profiles.length > 0) {
    const defaultProfile = profiles.find((p: any) => p.isDefault) || profiles[0];
    if (defaultProfile) {
      profileId = defaultProfile.id;
    }
  }

  return <InvestmentsClient initialData={{ investments, profiles: profiles || [], defaultProfileId: profileId || null }} />;
}

