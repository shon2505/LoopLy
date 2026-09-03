import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/customer/rewards
 * Returns all rewards for the authenticated customer with live expiry derivation.
 */
export async function GET() {
  try {
    const user = await requireCustomer();

    const rewards = await prisma.reward.findMany({
      where: { customerId: user.id },
      include: { business: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const enriched = rewards.map((r) => ({
      ...r,
      status: r.status === "AVAILABLE" && r.expiresAt <= now ? "EXPIRED" : r.status,
    }));

    return NextResponse.json({ rewards: enriched });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN_NOT_CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Fetch rewards error:", err);
    return NextResponse.json({ error: "Failed to fetch rewards." }, { status: 500 });
  }
}
