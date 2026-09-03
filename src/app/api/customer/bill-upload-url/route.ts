import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";
import { getSupabaseAdmin, getSupabaseBucket } from "@/lib/supabase";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/customer/bill-upload-url
 * Issues a short-lived Supabase Storage signed upload URL — server-side only.
 *
 * Security:
 *   - Service role key never exposed to browser.
 *   - Customer must be authenticated.
 *   - Membership must belong to this customer.
 *   - Business must use BILL verification method.
 *   - File type and size limits enforced before issuing the URL.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomer();

    const body = await request.json();
    const { membershipId, contentType, fileSizeBytes } = body as {
      membershipId: string;
      contentType: string;
      fileSizeBytes: number;
    };

    if (!membershipId || typeof membershipId !== "string") {
      return NextResponse.json({ error: "membershipId is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WEBP images are accepted." },
        { status: 400 }
      );
    }

    if (!fileSizeBytes || fileSizeBytes > MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be under 5 MB." },
        { status: 400 }
      );
    }

    // Verify membership belongs to this customer and uses BILL method
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { business: { include: { loyaltyProgram: true } } },
    });

    if (!membership || membership.customerId !== user.id) {
      return NextResponse.json({ error: "Membership not found." }, { status: 404 });
    }

    const program = membership.business.loyaltyProgram;
    if (!program || program.verificationMethod !== "BILL") {
      return NextResponse.json(
        { error: "This business does not use bill verification." },
        { status: 409 }
      );
    }

    // Generate a unique, collision-safe storage path
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const storagePath = `${user.id}/${membership.businessId}/${randomBytes(16).toString("hex")}.${ext}`;

    // Server-side Supabase admin client (Service Role Key strictly server-side)
    const supabase = getSupabaseAdmin();
    const bucket = getSupabaseBucket();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("Supabase createSignedUploadUrl error:", error);
      return NextResponse.json(
        { error: error?.message || "Failed to generate upload URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      storagePath,
      token: data.token,
    });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN_NOT_CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Bill upload URL error:", err);
    return NextResponse.json({ error: msg || "Failed to generate upload URL." }, { status: 500 });
  }
}
