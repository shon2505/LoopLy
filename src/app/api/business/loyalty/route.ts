import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { LoyaltyProgramSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/**
 * PUT /api/business/loyalty
 * Updates the loyalty program for the authenticated Business Owner.
 * Strict ownership isolation: resolves business via Business.ownerId === user.id.
 * Never accepts a client-provided businessId.
 * Never modifies Business.id, Business.ownerId, or Business.businessToken.
 * Never alters existing memberships, visits, or rewards.
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Authenticate Business Owner
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== UserRole.BUSINESS_OWNER) {
      return NextResponse.json(
        { error: "Forbidden: Only business owners can modify loyalty settings." },
        { status: 403 }
      );
    }

    // 2. Resolve business strictly from authenticated owner ID
    const business = await prisma.business.findUnique({
      where: { ownerId: user.id },
      include: { loyaltyProgram: true },
    });

    if (!business || !business.loyaltyProgram) {
      return NextResponse.json(
        { error: "No business configured for this owner." },
        { status: 404 }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const parsed = LoyaltyProgramSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      programName,
      requiredVisits,
      rewardTitle,
      rewardDescription,
      rewardValidityDays,
      verificationMethod,
      isActive,
    } = parsed.data;

    // 4. Update loyalty program (immutable business fields and customer memberships remain untouched)
    const updated = await prisma.loyaltyProgram.update({
      where: { id: business.loyaltyProgram.id },
      data: {
        programName,
        requiredVisits,
        rewardTitle,
        rewardDescription,
        rewardValidityDays,
        verificationMethod,
        isActive,
      },
    });

    return NextResponse.json(
      {
        success: true,
        loyaltyProgram: {
          id: updated.id,
          businessId: updated.businessId,
          programName: updated.programName,
          requiredVisits: updated.requiredVisits,
          rewardTitle: updated.rewardTitle,
          rewardDescription: updated.rewardDescription,
          rewardValidityDays: updated.rewardValidityDays,
          verificationMethod: updated.verificationMethod,
          isActive: updated.isActive,
          updatedAt: updated.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update loyalty program error:", error);
    return NextResponse.json(
      { error: "Failed to update loyalty program configuration." },
      { status: 500 }
    );
  }
}
