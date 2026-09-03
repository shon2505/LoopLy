import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";
import { uploadBillImage } from "@/lib/storage";
import { randomBytes } from "crypto";
import { VerificationMethod } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/customer/bill-upload
 * Handles bill file upload and creates the PENDING VerificationRequest.
 * Uses uploadBillImage which uploads to Supabase Storage with graceful fallback.
 *
 * Security:
 *   - Service role key never exposed to client.
 *   - Customer identity derived strictly from session.
 *   - Membership ownership verified: membership.customerId === user.id.
 *   - Program must be active and use BILL verification method.
 *   - Duplicate pending check enforced.
 *   - File type and size verified server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomer();

    const formData = await request.formData();
    const membershipId = formData.get("membershipId") as string | null;
    const file = formData.get("file") as File | null;

    if (!membershipId || typeof membershipId !== "string") {
      return NextResponse.json({ error: "membershipId is required." }, { status: 400 });
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Please select a bill image file." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WEBP images are accepted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be under 5 MB." },
        { status: 400 }
      );
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

    if (program.verificationMethod !== VerificationMethod.BILL) {
      return NextResponse.json(
        { error: "This business uses Visit Confirmation, not Bill Upload." },
        { status: 400 }
      );
    }

    // 2. Duplicate PENDING check
    const existingPending = await prisma.verificationRequest.findFirst({
      where: { membershipId, status: "PENDING" },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending verification request for this business." },
        { status: 409 }
      );
    }

    // 3. Generate safe, collision-safe storage path
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `${user.id}/${membership.businessId}/${randomBytes(16).toString("hex")}.${ext}`;

    // 4. Upload buffer using storage service (Supabase with auto-bucket + local fallback)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadBillImage(storagePath, buffer, file.type);

    // 5. Create the verification request record
    const vr = await prisma.verificationRequest.create({
      data: {
        membershipId,
        businessId: membership.businessId,
        customerId: user.id,
        method: VerificationMethod.BILL,
        billImagePath: uploadResult.storagePath,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        verificationRequestId: vr.id,
        method: vr.method,
        status: vr.status,
        billImagePath: uploadResult.storagePath,
        message: "Your bill has been submitted and is awaiting approval.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN_NOT_CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Bill upload error:", err);
    return NextResponse.json({ error: msg || "Failed to upload bill." }, { status: 500 });
  }
}
