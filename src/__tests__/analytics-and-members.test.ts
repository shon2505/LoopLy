import { describe, it, expect, beforeAll } from "vitest";
import prisma from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { UserRole, VerificationMethod, RequestStatus, RewardStatus } from "@prisma/client";

describe("Phase 6 — Business Analytics & Member Management", () => {
  const timestamp = Date.now();
  const ownerAEmail = `owner.analytics.a.${timestamp}@example.test`;
  const ownerBEmail = `owner.analytics.b.${timestamp}@example.test`;
  const customer1Email = `cust1.analytics.${timestamp}@example.test`;
  const customer2Email = `cust2.analytics.${timestamp}@example.test`;
  const password = "Password123!";

  let ownerAId = "";
  let ownerBId = "";
  let customer1Id = "";
  let customer2Id = "";

  let businessAId = "";
  let businessBId = "";
  let membership1Id = "";
  let membership2Id = "";

  beforeAll(async () => {
    const passwordHash = await hashPassword(password);

    // Create 2 Owners
    const ownerA = await prisma.user.create({
      data: {
        email: ownerAEmail,
        name: "Analytics Owner A",
        passwordHash,
        role: UserRole.BUSINESS_OWNER,
      },
    });
    ownerAId = ownerA.id;

    const ownerB = await prisma.user.create({
      data: {
        email: ownerBEmail,
        name: "Analytics Owner B",
        passwordHash,
        role: UserRole.BUSINESS_OWNER,
      },
    });
    ownerBId = ownerB.id;

    // Create 2 Customers
    const customer1 = await prisma.user.create({
      data: {
        email: customer1Email,
        name: "Alice Loyalist",
        passwordHash,
        role: UserRole.CUSTOMER,
      },
    });
    customer1Id = customer1.id;

    const customer2 = await prisma.user.create({
      data: {
        email: customer2Email,
        name: "Bob Regular",
        passwordHash,
        role: UserRole.CUSTOMER,
      },
    });
    customer2Id = customer2.id;

    // Create Business A
    const businessA = await prisma.business.create({
      data: {
        name: "Brew & Bean A",
        businessToken: `tok_an_${timestamp}`.slice(0, 16),
        ownerId: ownerAId,
        loyaltyProgram: {
          create: {
            programName: "Coffee Rewards",
            requiredVisits: 3,
            rewardTitle: "Free Cappuccino",
            rewardDescription: "Any size cappuccino on us.",
            rewardValidityDays: 30,
            verificationMethod: VerificationMethod.VISIT_CONFIRMATION,
            isActive: true,
          },
        },
      },
      include: { loyaltyProgram: true },
    });
    businessAId = businessA.id;

    // Create Business B
    const businessB = await prisma.business.create({
      data: {
        name: "Bakery B",
        businessToken: `tok_bn_${timestamp}`.slice(0, 16),
        ownerId: ownerBId,
        loyaltyProgram: {
          create: {
            programName: "Bakery Club",
            requiredVisits: 5,
            rewardTitle: "Free Pastry",
            rewardDescription: "Choice of pastry.",
            rewardValidityDays: 14,
            verificationMethod: VerificationMethod.BILL,
            isActive: true,
          },
        },
      },
      include: { loyaltyProgram: true },
    });
    businessBId = businessB.id;

    // Enroll Customer 1 in Business A (totalVisits = 3, repeat member)
    const mem1 = await prisma.membership.create({
      data: {
        customerId: customer1Id,
        businessId: businessAId,
        currentVisits: 0,
        totalVisits: 3,
      },
    });
    membership1Id = mem1.id;

    // Create 3 visits for Customer 1
    for (let i = 0; i < 3; i++) {
      await prisma.visit.create({
        data: {
          membershipId: membership1Id,
          businessId: businessAId,
          customerId: customer1Id,
        },
      });
    }

    // Enroll Customer 2 in Business A (totalVisits = 1, single visit member)
    const mem2 = await prisma.membership.create({
      data: {
        customerId: customer2Id,
        businessId: businessAId,
        currentVisits: 1,
        totalVisits: 1,
      },
    });
    membership2Id = mem2.id;

    await prisma.visit.create({
      data: {
        membershipId: membership2Id,
        businessId: businessAId,
        customerId: customer2Id,
      },
    });

    // Create 1 active Reward and 1 redeemed Reward for Business A
    const now = new Date();
    await prisma.reward.create({
      data: {
        membershipId: membership1Id,
        businessId: businessAId,
        customerId: customer1Id,
        loyaltyProgramId: businessA.loyaltyProgram!.id,
        title: "Free Cappuccino",
        description: "Any size cappuccino on us.",
        status: RewardStatus.AVAILABLE,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.reward.create({
      data: {
        membershipId: membership1Id,
        businessId: businessAId,
        customerId: customer1Id,
        loyaltyProgramId: businessA.loyaltyProgram!.id,
        title: "Free Cappuccino",
        description: "Any size cappuccino on us.",
        status: RewardStatus.REDEEMED,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        redeemedAt: now,
        redeemedByUserId: ownerAId,
      },
    });
  });

  describe("Analytics KPIs & Aggregations", () => {
    it("computes accurate member count, repeat rate, and visit metrics for Business A", async () => {
      const [totalMembers, repeatMembersCount, totalVisits, totalRewards, redeemedRewards] =
        await Promise.all([
          prisma.membership.count({ where: { businessId: businessAId } }),
          prisma.membership.count({ where: { businessId: businessAId, totalVisits: { gte: 2 } } }),
          prisma.visit.count({ where: { businessId: businessAId } }),
          prisma.reward.count({ where: { businessId: businessAId } }),
          prisma.reward.count({ where: { businessId: businessAId, status: RewardStatus.REDEEMED } }),
        ]);

      expect(totalMembers).toBe(2);
      expect(repeatMembersCount).toBe(1); // Only customer 1 has >= 2 visits
      expect(totalVisits).toBe(4); // 3 + 1
      expect(totalRewards).toBe(2);
      expect(redeemedRewards).toBe(1);

      const repeatRate = Math.round((repeatMembersCount / totalMembers) * 100);
      expect(repeatRate).toBe(50); // 1 out of 2 = 50%
    });

    it("verifies Business B metrics are completely isolated from Business A", async () => {
      const totalMembersB = await prisma.membership.count({ where: { businessId: businessBId } });
      const totalVisitsB = await prisma.visit.count({ where: { businessId: businessBId } });

      expect(totalMembersB).toBe(0);
      expect(totalVisitsB).toBe(0);
    });
  });

  describe("Member Management & Search Filtering", () => {
    it("queries all members for Business A with correct customer details", async () => {
      const members = await prisma.membership.findMany({
        where: { businessId: businessAId },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          rewards: true,
          visits: { orderBy: { visitedAt: "desc" }, take: 1 },
        },
        orderBy: { joinedAt: "desc" },
      });

      expect(members.length).toBe(2);
      expect(members.some((m) => m.customer.name === "Alice Loyalist")).toBe(true);
      expect(members.some((m) => m.customer.name === "Bob Regular")).toBe(true);
    });

    it("supports search filtering by customer name", async () => {
      const search = "Alice";
      const members = await prisma.membership.findMany({
        where: {
          businessId: businessAId,
          customer: { name: { contains: search, mode: "insensitive" } },
        },
        include: { customer: true },
      });

      expect(members.length).toBe(1);
      expect(members[0].customer.name).toBe("Alice Loyalist");
    });

    it("supports search filtering by customer email", async () => {
      const search = "cust2.analytics";
      const members = await prisma.membership.findMany({
        where: {
          businessId: businessAId,
          customer: { email: { contains: search, mode: "insensitive" } },
        },
        include: { customer: true },
      });

      expect(members.length).toBe(1);
      expect(members[0].customer.email).toBe(customer2Email);
    });
  });
});
