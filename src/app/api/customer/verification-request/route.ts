import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";
import { VerificationMethod } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/customer/verification-request
 * Creates a new VerificationRequest for an authenticated customer.
 *
 * Security:
 * - Customer identity from server-side session only.
 * - Membership ownership verified: membership.customerId === user.id.
 * - Business resolved from membership (never from body alone).
 * - Program must be active.
 * - Duplicate-pending check: one PENDING per membership at a time.
 * - billImagePath must not be trusted for path traversal – stored as-is from signed-URL flow.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomer();

    const body = await request.json();
    const { membershipId, billImagePath } = body as {
      membershipId: string;
      billImagePath?: string;
    };

    if (!membershipId || typeof membershipId !== "string") {
      return NextResponse.json({ error: "membershipId is required." }, { status: 400 });
    }

    // 1. Verify membership belongs to this customer
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        business: { include: { loyaltyProgram: true } },
      },
    });

    if (!membership || membership.customerId !== user.id) {
      return NextResponse.json({ error: "Membership not found." }, { status: 404 });
    }

    const program = membership.business.loyaltyProgram;
    if (!program || !program.isActive) {
      return NextResponse.json(
        { error: "This loyalty program is not currently active." },
        { status: 409 }
      );
    }

    // 2. Duplicate PENDING check (one per membership at a time)
    const existingPending = await prisma.verificationRequest.findFirst({
      where: { membershipId, status: "PENDING" },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending verification request for this business." },
        { status: 409 }
      );
    }

    // 3. Bill method requires a billImagePath
    if (program.verificationMethod === VerificationMethod.BILL) {
      if (!billImagePath || typeof billImagePath !== "string" || billImagePath.trim() === "") {
        return NextResponse.json(
          { error: "A bill image is required for this business." },
          { status: 400 }
        );
      }
    }

    // 4. Create the verification request
    const vr = await prisma.verificationRequest.create({
      data: {
        membershipId,
        businessId: membership.businessId,
        customerId: user.id,
        method: program.verificationMethod,
        billImagePath: program.verificationMethod === VerificationMethod.BILL
          ? billImagePath!.trim()
          : null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        verificationRequestId: vr.id,
        method: vr.method,
        status: vr.status,
        message: "Your visit request has been submitted and is awaiting approval.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN_NOT_CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Create verification request error:", err);
    return NextResponse.json({ error: "Failed to submit verification request." }, { status: 500 });
  }
}
