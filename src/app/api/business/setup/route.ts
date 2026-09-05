import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { BusinessSetupSchema } from "@/lib/validations";
import { generateBusinessToken } from "@/lib/token";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Business Owner
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== UserRole.BUSINESS_OWNER) {
      return NextResponse.json(
        { error: "Forbidden: Only business owners can configure a business." },
        { status: 403 }
      );
    }

    // 2. Check for duplicate setup (owner can have only one business in V1)
    const existingBusiness = await prisma.business.findUnique({
      where: { ownerId: user.id },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: "Business already configured" },
        { status: 409 }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const parsed = BusinessSetupSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      name,
      programName,
      requiredVisits,
      rewardTitle,
      rewardDescription,
      rewardValidityDays,
      verificationMethod,
      rewardType,
      googleReviewUrl,
      instagramHandle,
      rewardType,
      googleReviewUrl,
      instagramHandle,
    } = parsed.data;

    // 4. Generate permanent unique businessToken
    const businessToken = generateBusinessToken(12);

    // 5. Atomic transaction: create Business + LoyaltyProgram
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name,
          businessToken,
          ownerId: user.id,
          googleReviewUrl: googleReviewUrl || null,
          instagramHandle: instagramHandle || null,
          loyaltyProgram: {
            create: {
              programName,
              requiredVisits,
              rewardTitle,
              rewardDescription,
              rewardValidityDays,
              verificationMethod,
              rewardType,
              isActive: true,
            },
          },
        },
        include: {
          loyaltyProgram: true,
        },
      });

      return business;
    });

    return NextResponse.json(
      {
        success: true,
        business: {
          id: result.id,
          name: result.name,
          businessToken: result.businessToken,
          createdAt: result.createdAt,
          loyaltyProgram: result.loyaltyProgram,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Business setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup business. Please try again." },
      { status: 500 }
    );
  }
}
