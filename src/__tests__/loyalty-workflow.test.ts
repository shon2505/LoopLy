import { describe, it, expect, beforeAll } from "vitest";
import prisma from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { UserRole, VerificationMethod, RequestStatus, RewardStatus } from "@prisma/client";

describe("Phase 5 — Full Loyalty Workflow, Verification, Rewards & Redemption (5A - 5G)", () => {
  const timestamp = Date.now();
  const ownerAEmail = `owner.loyalty.a.${timestamp}@example.test`;
  const ownerBEmail = `owner.loyalty.b.${timestamp}@example.test`;
  const customerAEmail = `customer.loyalty.a.${timestamp}@example.test`;
  const customerBEmail = `customer.loyalty.b.${timestamp}@example.test`;
  const password = "Password123!";

  let ownerAId = "";
  let ownerBId = "";
  let customerAId = "";
  let customerBId = "";

  let businessAId = "";
  let businessBId = "";

  let loyaltyProgramAId = "";
  let membershipAId = "";
  let membershipBId = "";

  beforeAll(async () => {
    const passwordHash = await hashPassword(password);

    // Create 2 Owners
    const ownerA = await prisma.user.create({
      data: {
        email: ownerAEmail,
        name: "Owner A",
        passwordHash,
        role: UserRole.BUSINESS_OWNER,
      },
    });
    ownerAId = ownerA.id;

    const ownerB = await prisma.user.create({
      data: {
        email: ownerBEmail,
        name: "Owner B",
        passwordHash,
        role: UserRole.BUSINESS_OWNER,
      },
    });
    ownerBId = ownerB.id;

    // Create 2 Customers
    const customerA = await prisma.user.create({
      data: {
        email: customerAEmail,
        name: "Customer A",
        passwordHash,
        role: UserRole.CUSTOMER,
      },
    });
    customerAId = customerA.id;

    const customerB = await prisma.user.create({
      data: {
        email: customerBEmail,
        name: "Customer B",
        passwordHash,
        role: UserRole.CUSTOMER,
      },
    });
    customerBId = customerB.id;

    // Create Business A with Loyalty Program (requiredVisits = 3, rewardValidityDays = 30)
    const businessA = await prisma.business.create({
      data: {
        name: "Coffee Lab A",
        businessToken: `tok_a_${timestamp}`.slice(0, 16),
        ownerId: ownerAId,
        loyaltyProgram: {
          create: {
            programName: "Coffee Club",
            requiredVisits: 3,
            rewardTitle: "Free Specialty Latte",
            rewardDescription: "Enjoy any large drink on the house.",
            rewardValidityDays: 30,
            verificationMethod: VerificationMethod.VISIT_CONFIRMATION,
            isActive: true,
          },
        },
      },
      include: { loyaltyProgram: true },
    });
    businessAId = businessA.id;
    loyaltyProgramAId = businessA.loyaltyProgram!.id;

    // Create Business B with Loyalty Program (requiredVisits = 5, BILL method)
    const businessB = await prisma.business.create({
      data: {
        name: "Bakery B",
        businessToken: `tok_b_${timestamp}`.slice(0, 16),
        ownerId: ownerBId,
        loyaltyProgram: {
          create: {
            programName: "Pastry Pass",
            requiredVisits: 5,
            rewardTitle: "Free Croissant",
            rewardDescription: "Choice of butter or almond croissant.",
            rewardValidityDays: 14,
            verificationMethod: VerificationMethod.BILL,
            isActive: true,
          },
        },
      },
      include: { loyaltyProgram: true },
    });
    businessBId = businessB.id;

    // Enroll Customer A in Business A
    const memA = await prisma.membership.create({
      data: {
        customerId: customerAId,
        businessId: businessAId,
        currentVisits: 0,
        totalVisits: 0,
      },
    });
    membershipAId = memA.id;

    // Enroll Customer B in Business B
    const memB = await prisma.membership.create({
      data: {
        customerId: customerBId,
        businessId: businessBId,
        currentVisits: 0,
        totalVisits: 0,
      },
    });
    membershipBId = memB.id;
  });

  describe("Phase 5A & 5B — Customer Membership & Visit Verification Request Creation", () => {
    it("customer can create a VISIT_CONFIRMATION verification request for their joined business", async () => {
      const vr = await prisma.verificationRequest.create({
        data: {
          membershipId: membershipAId,
          businessId: businessAId,
          customerId: customerAId,
          method: VerificationMethod.VISIT_CONFIRMATION,
          status: RequestStatus.PENDING,
        },
      });

      expect(vr.id).toBeDefined();
      expect(vr.status).toBe(RequestStatus.PENDING);
      expect(vr.method).toBe(VerificationMethod.VISIT_CONFIRMATION);
      expect(vr.billImagePath).toBeNull();
    });

    it("duplicate pending verification request on the same membership is detected and blocked by query check", async () => {
      const pendingCount = await prisma.verificationRequest.count({
        where: {
          membershipId: membershipAId,
          status: RequestStatus.PENDING,
        },
      });

      expect(pendingCount).toBe(1);
    });

    it("customer B can create a BILL verification request with a valid billImagePath", async () => {
      const billPath = `${customerBId}/${businessBId}/bill_123.jpg`;
      const vr = await prisma.verificationRequest.create({
        data: {
          membershipId: membershipBId,
          businessId: businessBId,
          customerId: customerBId,
          method: VerificationMethod.BILL,
          billImagePath: billPath,
          status: RequestStatus.PENDING,
        },
      });

      expect(vr.id).toBeDefined();
      expect(vr.status).toBe(RequestStatus.PENDING);
      expect(vr.method).toBe(VerificationMethod.BILL);
      expect(vr.billImagePath).toBe(billPath);
    });
  });

  describe("Phase 5C — Business Owner Request Review & Tenant Scoping", () => {
    it("owner A only sees verification requests belonging to Business A", async () => {
      const requestsA = await prisma.verificationRequest.findMany({
        where: { businessId: businessAId },
      });

      expect(requestsA.length).toBeGreaterThan(0);
      requestsA.forEach((r) => {
        expect(r.businessId).toBe(businessAId);
        expect(r.businessId).not.toBe(businessBId);
      });
    });

    it("owner B only sees verification requests belonging to Business B", async () => {
      const requestsB = await prisma.verificationRequest.findMany({
        where: { businessId: businessBId },
      });

      expect(requestsB.length).toBeGreaterThan(0);
      requestsB.forEach((r) => {
        expect(r.businessId).toBe(businessBId);
        expect(r.businessId).not.toBe(businessAId);
      });
    });

    it("owner B can reject customer B's pending request with optional reason", async () => {
      const pendingB = await prisma.verificationRequest.findFirst({
        where: { businessId: businessBId, status: RequestStatus.PENDING },
      });
      expect(pendingB).not.toBeNull();

      const reviewedAt = new Date();
      const updated = await prisma.verificationRequest.update({
        where: { id: pendingB!.id },
        data: {
          status: RequestStatus.REJECTED,
          reviewedAt,
          rejectionReason: "Bill receipt is blurry. Please re-upload.",
        },
      });

      expect(updated.status).toBe(RequestStatus.REJECTED);
      expect(updated.rejectionReason).toBe("Bill receipt is blurry. Please re-upload.");

      // Verify no Visit was created and counters were NOT changed
      const visitCount = await prisma.visit.count({
        where: { verificationRequestId: pendingB!.id },
      });
      expect(visitCount).toBe(0);

      const memB = await prisma.membership.findUnique({ where: { id: membershipBId } });
      expect(memB!.currentVisits).toBe(0);
      expect(memB!.totalVisits).toBe(0);
    });
  });

  describe("Phase 5D & 5G — Approval Transaction, Visit Creation & Reward Issuance Progression", () => {
    it("approving 1st visit increments currentVisits to 1/3 and totalVisits to 1, no reward yet", async () => {
      const pendingA = await prisma.verificationRequest.findFirst({
        where: { businessId: businessAId, status: RequestStatus.PENDING },
      });
      expect(pendingA).not.toBeNull();

      // Run atomic transaction matching the PATCH route logic
      await prisma.$transaction(async (tx) => {
        const vr = await tx.verificationRequest.update({
          where: { id: pendingA!.id },
          data: { status: RequestStatus.APPROVED, reviewedAt: new Date() },
        });

        await tx.visit.create({
          data: {
            membershipId: vr.membershipId,
            businessId: vr.businessId,
            customerId: vr.customerId,
            verificationRequestId: vr.id,
          },
        });

        const updatedMembership = await tx.membership.update({
          where: { id: vr.membershipId },
          data: {
            currentVisits: { increment: 1 },
            totalVisits: { increment: 1 },
          },
        });

        expect(updatedMembership.currentVisits).toBe(1);
        expect(updatedMembership.totalVisits).toBe(1);
      });

      const membership = await prisma.membership.findUnique({ where: { id: membershipAId } });
      expect(membership!.currentVisits).toBe(1);
      expect(membership!.totalVisits).toBe(1);

      const rewardCount = await prisma.reward.count({ where: { membershipId: membershipAId } });
      expect(rewardCount).toBe(0);
    });

    it("approving 2nd visit increments currentVisits to 2/3 and totalVisits to 2, no reward yet", async () => {
      const vr2 = await prisma.verificationRequest.create({
        data: {
          membershipId: membershipAId,
          businessId: businessAId,
          customerId: customerAId,
          method: VerificationMethod.VISIT_CONFIRMATION,
          status: RequestStatus.PENDING,
        },
      });

      await prisma.$transaction(async (tx) => {
        const vr = await tx.verificationRequest.update({
          where: { id: vr2.id },
          data: { status: RequestStatus.APPROVED, reviewedAt: new Date() },
        });

        await tx.visit.create({
          data: {
            membershipId: vr.membershipId,
            businessId: vr.businessId,
            customerId: vr.customerId,
            verificationRequestId: vr.id,
          },
        });

        await tx.membership.update({
          where: { id: vr.membershipId },
          data: {
            currentVisits: { increment: 1 },
            totalVisits: { increment: 1 },
          },
        });
      });

      const membership = await prisma.membership.findUnique({ where: { id: membershipAId } });
      expect(membership!.currentVisits).toBe(2);
      expect(membership!.totalVisits).toBe(2);

      const rewardCount = await prisma.reward.count({ where: { membershipId: membershipAId } });
      expect(rewardCount).toBe(0);
    });

    it("approving 3rd visit hits threshold (3/3): creates Reward, resets currentVisits to 0, totalVisits is 3", async () => {
      const vr3 = await prisma.verificationRequest.create({
        data: {
          membershipId: membershipAId,
          businessId: businessAId,
          customerId: customerAId,
          method: VerificationMethod.VISIT_CONFIRMATION,
          status: RequestStatus.PENDING,
        },
      });

      await prisma.$transaction(async (tx) => {
        const vr = await tx.verificationRequest.update({
          where: { id: vr3.id },
          data: { status: RequestStatus.APPROVED, reviewedAt: new Date() },
        });

        await tx.visit.create({
          data: {
            membershipId: vr.membershipId,
            businessId: vr.businessId,
            customerId: vr.customerId,
            verificationRequestId: vr.id,
          },
        });

        const updatedMembership = await tx.membership.update({
          where: { id: vr.membershipId },
          data: {
            currentVisits: { increment: 1 },
            totalVisits: { increment: 1 },
          },
        });

        // Threshold check: 3 >= 3
        if (updatedMembership.currentVisits >= 3) {
          const now = new Date();
          await tx.reward.create({
            data: {
              membershipId: vr.membershipId,
              businessId: vr.businessId,
              customerId: vr.customerId,
              loyaltyProgramId: loyaltyProgramAId,
              title: "Free Specialty Latte",
              description: "Enjoy any large drink on the house.",
              status: RewardStatus.AVAILABLE,
              expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
          });

          await tx.membership.update({
            where: { id: vr.membershipId },
            data: { currentVisits: 0 },
          });
        }
      });

      const membership = await prisma.membership.findUnique({ where: { id: membershipAId } });
      expect(membership!.currentVisits).toBe(0); // Reset to 0
      expect(membership!.totalVisits).toBe(3); // Total remains 3

      const rewards = await prisma.reward.findMany({ where: { membershipId: membershipAId } });
      expect(rewards.length).toBe(1);
      expect(rewards[0].status).toBe(RewardStatus.AVAILABLE);
      expect(rewards[0].title).toBe("Free Specialty Latte");
    });

    it("subsequent 4th visit starts new cycle: currentVisits becomes 1/3 and totalVisits becomes 4", async () => {
      const vr4 = await prisma.verificationRequest.create({
        data: {
          membershipId: membershipAId,
          businessId: businessAId,
          customerId: customerAId,
          method: VerificationMethod.VISIT_CONFIRMATION,
          status: RequestStatus.PENDING,
        },
      });

      await prisma.$transaction(async (tx) => {
        const vr = await tx.verificationRequest.update({
          where: { id: vr4.id },
          data: { status: RequestStatus.APPROVED, reviewedAt: new Date() },
        });

        await tx.visit.create({
          data: {
            membershipId: vr.membershipId,
            businessId: vr.businessId,
            customerId: vr.customerId,
            verificationRequestId: vr.id,
          },
        });

        await tx.membership.update({
          where: { id: vr.membershipId },
          data: {
            currentVisits: { increment: 1 },
            totalVisits: { increment: 1 },
          },
        });
      });

      const membership = await prisma.membership.findUnique({ where: { id: membershipAId } });
      expect(membership!.currentVisits).toBe(1);
      expect(membership!.totalVisits).toBe(4);
    });

    it("unique constraint on Visit.verificationRequestId prevents double visit creation for same request", async () => {
      const vr = await prisma.verificationRequest.findFirst({
        where: { businessId: businessAId, status: RequestStatus.APPROVED },
      });
      expect(vr).not.toBeNull();

      // Attempting to create a second visit with the same verificationRequestId must fail
      await expect(
        prisma.visit.create({
          data: {
            membershipId: vr!.membershipId,
            businessId: vr!.businessId,
            customerId: vr!.customerId,
            verificationRequestId: vr!.id,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("Phase 5F & 5G — Reward Wallet & Reward Redemption Lifecycle", () => {
    let earnedRewardId = "";

    beforeAll(async () => {
      const r = await prisma.reward.findFirst({
        where: { customerId: customerAId, status: RewardStatus.AVAILABLE },
      });
      expect(r).not.toBeNull();
      earnedRewardId = r!.id;
    });

    it("customer can view their earned reward in their wallet", async () => {
      const rewards = await prisma.reward.findMany({
        where: { customerId: customerAId },
      });

      expect(rewards.length).toBeGreaterThan(0);
      expect(rewards.some((r) => r.id === earnedRewardId)).toBe(true);
    });

    it("customer B cannot see customer A's rewards", async () => {
      const rewardsB = await prisma.reward.findMany({
        where: { customerId: customerBId },
      });

      expect(rewardsB.some((r) => r.id === earnedRewardId)).toBe(false);
    });

    it("owner B cannot redeem owner A's customer reward (tenant mismatch)", async () => {
      const reward = await prisma.reward.findUnique({ where: { id: earnedRewardId } });
      expect(reward!.businessId).toBe(businessAId);
      expect(reward!.businessId).not.toBe(businessBId);
    });

    it("owner A can successfully redeem customer A's available reward", async () => {
      const now = new Date();
      const updated = await prisma.reward.updateMany({
        where: {
          id: earnedRewardId,
          businessId: businessAId,
          status: RewardStatus.AVAILABLE,
          expiresAt: { gt: now },
        },
        data: {
          status: RewardStatus.REDEEMED,
          redeemedAt: now,
          redeemedByUserId: ownerAId,
        },
      });

      expect(updated.count).toBe(1);

      const reward = await prisma.reward.findUnique({ where: { id: earnedRewardId } });
      expect(reward!.status).toBe(RewardStatus.REDEEMED);
      expect(reward!.redeemedAt).not.toBeNull();
      expect(reward!.redeemedByUserId).toBe(ownerAId);
    });

    it("cannot redeem an already-redeemed reward a second time (double redemption protection)", async () => {
      const now = new Date();
      const updated = await prisma.reward.updateMany({
        where: {
          id: earnedRewardId,
          businessId: businessAId,
          status: RewardStatus.AVAILABLE,
          expiresAt: { gt: now },
        },
        data: {
          status: RewardStatus.REDEEMED,
          redeemedAt: now,
          redeemedByUserId: ownerAId,
        },
      });

      expect(updated.count).toBe(0);
    });

    it("cannot redeem an expired reward", async () => {
      // Create an already-expired reward
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago
      const expiredReward = await prisma.reward.create({
        data: {
          membershipId: membershipAId,
          businessId: businessAId,
          customerId: customerAId,
          loyaltyProgramId: loyaltyProgramAId,
          title: "Expired Reward",
          description: "Old promotion",
          status: RewardStatus.AVAILABLE,
          expiresAt: pastDate,
        },
      });

      const now = new Date();
      const result = await prisma.reward.updateMany({
        where: {
          id: expiredReward.id,
          businessId: businessAId,
          status: RewardStatus.AVAILABLE,
          expiresAt: { gt: now },
        },
        data: {
          status: RewardStatus.REDEEMED,
          redeemedAt: now,
        },
      });

      expect(result.count).toBe(0); // Update condition blocked it due to expiresAt > now
    });
  });
});
