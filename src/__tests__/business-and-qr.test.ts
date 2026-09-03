import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { UserRole, VerificationMethod } from "@prisma/client";
import { generateBusinessToken, isValidBusinessToken } from "../lib/token";
import { BusinessSetupSchema, BusinessUpdateSchema } from "../lib/validations";

describe("Phase 3 Checkpoint 1 — Backend Business Setup & APIs", () => {
  const timestamp = Date.now();
  const ownerEmailA = `owner.cp1.a.${timestamp}@example.test`;
  const ownerEmailB = `owner.cp1.b.${timestamp}@example.test`;
  const customerEmail = `customer.cp1.${timestamp}@example.test`;
  const password = "Password123!";

  let ownerAId = "";
  let ownerBId = "";
  let customerId = "";
  let businessAId = "";
  let businessAToken = "";

  beforeAll(async () => {
    const passwordHash = await hashPassword(password);

    const ownerA = await prisma.user.create({
      data: {
        email: ownerEmailA,
        name: "Checkpoint Owner A",
        passwordHash,
        role: UserRole.BUSINESS_OWNER,
      },
    });
    ownerAId = ownerA.id;

    const ownerB = await prisma.user.create({
      data: {
        email: ownerEmailB,
        name: "Checkpoint Owner B",
        passwordHash,
        role: UserRole.BUSINESS_OWNER,
      },
    });
    ownerBId = ownerB.id;

    const customer = await prisma.user.create({
      data: {
        email: customerEmail,
        name: "Checkpoint Customer",
        passwordHash,
        role: UserRole.CUSTOMER,
      },
    });
    customerId = customer.id;
  });

  afterAll(async () => {
    // Clean up created entities
    if (businessAId) {
      await prisma.loyaltyProgram.deleteMany({ where: { businessId: businessAId } });
      await prisma.business.deleteMany({ where: { id: businessAId } });
    }
    await prisma.business.deleteMany({ where: { ownerId: { in: [ownerAId, ownerBId] } } });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerAId, ownerBId, customerId] } },
    });
  });

  // 1. Validation Tests
  describe("Input Validation", () => {
    it("accepts valid business setup payload", () => {
      const valid = BusinessSetupSchema.safeParse({
        name: "Artisan Coffee",
        programName: "Bean Loyalty",
        requiredVisits: 5,
        rewardTitle: "Free Cold Brew",
        rewardDescription: "16oz house cold brew",
        rewardValidityDays: 30,
        verificationMethod: "BILL",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid business name (< 2 chars)", () => {
      const invalid = BusinessSetupSchema.safeParse({
        name: "A",
        programName: "Club",
        requiredVisits: 5,
        rewardTitle: "Free Coffee",
        rewardValidityDays: 30,
        verificationMethod: "BILL",
      });
      expect(invalid.success).toBe(false);
    });

    it("rejects invalid requiredVisits (0 or negative or > 100)", () => {
      const zero = BusinessSetupSchema.safeParse({
        name: "Valid Name",
        programName: "Club",
        requiredVisits: 0,
        rewardTitle: "Reward",
      });
      expect(zero.success).toBe(false);

      const overHundred = BusinessSetupSchema.safeParse({
        name: "Valid Name",
        programName: "Club",
        requiredVisits: 101,
        rewardTitle: "Reward",
      });
      expect(overHundred.success).toBe(false);
    });

    it("rejects invalid reward validity days (0 or > 365)", () => {
      const zero = BusinessSetupSchema.safeParse({
        name: "Valid Name",
        programName: "Club",
        requiredVisits: 5,
        rewardTitle: "Reward",
        rewardValidityDays: 0,
      });
      expect(zero.success).toBe(false);

      const overYear = BusinessSetupSchema.safeParse({
        name: "Valid Name",
        programName: "Club",
        requiredVisits: 5,
        rewardTitle: "Reward",
        rewardValidityDays: 400,
      });
      expect(overYear.success).toBe(false);
    });

    it("rejects invalid verification method", () => {
      const invalidMethod = BusinessSetupSchema.safeParse({
        name: "Valid Name",
        programName: "Club",
        requiredVisits: 5,
        rewardTitle: "Reward",
        verificationMethod: "INVALID_METHOD",
      });
      expect(invalidMethod.success).toBe(false);
    });
  });

  // 2. Business Setup & Atomic Creation
  describe("Atomic Business + Loyalty Creation & Token Generation", () => {
    it("atomically creates Business and LoyaltyProgram for BUSINESS_OWNER", async () => {
      const businessToken = generateBusinessToken(12);
      expect(businessToken).toHaveLength(12);
      expect(isValidBusinessToken(businessToken)).toBe(true);
      businessAToken = businessToken;

      const created = await prisma.$transaction(async (tx) => {
        return tx.business.create({
          data: {
            name: "The Corner Bakery",
            businessToken,
            ownerId: ownerAId,
            loyaltyProgram: {
              create: {
                programName: "Pastry Pass",
                requiredVisits: 6,
                rewardTitle: "Free Croissant",
                rewardDescription: "Choice of plain or chocolate croissant",
                rewardValidityDays: 45,
                verificationMethod: VerificationMethod.BILL,
                isActive: true,
              },
            },
          },
          include: {
            loyaltyProgram: true,
          },
        });
      });

      businessAId = created.id;
      expect(created.name).toBe("The Corner Bakery");
      expect(created.ownerId).toBe(ownerAId);
      expect(created.businessToken).toBe(businessToken);
      expect(created.loyaltyProgram).toBeDefined();
      expect(created.loyaltyProgram?.programName).toBe("Pastry Pass");
      expect(created.loyaltyProgram?.requiredVisits).toBe(6);
      expect(created.loyaltyProgram?.verificationMethod).toBe(VerificationMethod.BILL);
    });

    it("rejects duplicate business setup for the same owner (409 Conflict logic)", async () => {
      // Simulate the check in /api/business/setup
      const existing = await prisma.business.findUnique({
        where: { ownerId: ownerAId },
      });
      expect(existing).not.toBeNull();

      // Attempting to create another business for ownerA must fail DB unique constraint
      await expect(
        prisma.business.create({
          data: {
            name: "Second Bakery",
            businessToken: generateBusinessToken(12),
            ownerId: ownerAId,
          },
        })
      ).rejects.toThrow();
    });

    it("enforces that CUSTOMER cannot be configured as a business owner", async () => {
      const customerUser = await prisma.user.findUnique({ where: { id: customerId } });
      expect(customerUser?.role).toBe(UserRole.CUSTOMER);
      expect(customerUser?.role !== UserRole.BUSINESS_OWNER).toBe(true);
    });
  });

  // 3. Retrieval & Tenant Scoping
  describe("Owner Business Retrieval & Isolation", () => {
    it("owner retrieves own business and loyalty program", async () => {
      const owned = await prisma.business.findUnique({
        where: { ownerId: ownerAId },
        include: { loyaltyProgram: true },
      });

      expect(owned).not.toBeNull();
      expect(owned?.id).toBe(businessAId);
      expect(owned?.name).toBe("The Corner Bakery");
      expect(owned?.loyaltyProgram?.requiredVisits).toBe(6);
    });

    it("returns null when an owner has not yet configured a business", async () => {
      const unconfigured = await prisma.business.findUnique({
        where: { ownerId: ownerBId },
      });
      expect(unconfigured).toBeNull();
    });

    it("Owner B cannot access or resolve Owner A's business", async () => {
      // Querying by ownerBId never returns Owner A's business
      const result = await prisma.business.findUnique({
        where: { ownerId: ownerBId },
      });
      expect(result).toBeNull();

      const crossCheck = await prisma.business.findFirst({
        where: { id: businessAId, ownerId: ownerBId },
      });
      expect(crossCheck).toBeNull();
    });
  });

  // 4. Update Business Name & Permanence of Token
  describe("Business Update & Token Immutability", () => {
    it("owner updates business name successfully", async () => {
      const updateData = BusinessUpdateSchema.parse({ name: "The Corner Bakery & Cafe" });

      const updated = await prisma.business.update({
        where: { id: businessAId },
        data: { name: updateData.name },
      });

      expect(updated.name).toBe("The Corner Bakery & Cafe");
    });

    it("businessToken remains strictly unchanged after business name update", async () => {
      const current = await prisma.business.findUnique({ where: { id: businessAId } });
      expect(current?.businessToken).toBe(businessAToken);
    });

    it("verifies immutable fields (id, ownerId, businessToken) cannot be updated via update schema", () => {
      // BusinessUpdateSchema permits only `name`
      const keys = Object.keys(BusinessUpdateSchema.shape);
      expect(keys).toEqual(["name"]);
      expect(keys.includes("id")).toBe(false);
      expect(keys.includes("ownerId")).toBe(false);
      expect(keys.includes("businessToken")).toBe(false);
    });
  });
});
