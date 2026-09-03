import { z } from "zod";

// =============================================================================
// DOMAIN ENUMS (matching Prisma schema)
// =============================================================================

export const UserRoleSchema = z.enum(["CUSTOMER", "BUSINESS_OWNER"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const VerificationMethodSchema = z.enum(["BILL", "VISIT_CONFIRMATION"]);
export type VerificationMethod = z.infer<typeof VerificationMethodSchema>;

export const RequestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

export const RewardStatusSchema = z.enum(["AVAILABLE", "REDEEMED", "EXPIRED"]);
export type RewardStatus = z.infer<typeof RewardStatusSchema>;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

export const UserRegistrationSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  role: UserRoleSchema.default("CUSTOMER"),
});

export const UserLoginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
  role: UserRoleSchema.optional(),
});

export const BusinessCreateSchema = z.object({
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters")
    .trim(),
  businessToken: z.string().min(8).max(32).optional(),
});

export const BusinessSetupSchema = z.object({
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters")
    .trim(),
  programName: z.string().min(2, "Program name must be at least 2 characters").max(100).trim(),
  requiredVisits: z.number().int().min(1, "Required visits must be at least 1").max(100, "Required visits must be at most 100"),
  rewardTitle: z.string().min(2, "Reward title must be at least 2 characters").max(100).trim(),
  rewardDescription: z.string().max(500).trim().default(""),
  rewardValidityDays: z.number().int().min(1, "Validity must be at least 1 day").max(365, "Validity must be at most 365 days").default(30),
  verificationMethod: VerificationMethodSchema.default("VISIT_CONFIRMATION"),
});

export const BusinessUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters")
    .trim(),
});

export const LoyaltyProgramSchema = z.object({
  programName: z.string().min(2).max(100).trim(),
  requiredVisits: z.number().int().min(1, "At least 1 visit required").max(100),
  rewardTitle: z.string().min(2).max(100).trim(),
  rewardDescription: z.string().max(500).trim().default(""),
  rewardValidityDays: z.number().int().min(1).max(365).default(30),
  verificationMethod: VerificationMethodSchema.default("VISIT_CONFIRMATION"),
  isActive: z.boolean().default(true),
});

export const VerificationRequestCreateSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  membershipId: z.string().min(1, "Membership ID is required"),
  method: VerificationMethodSchema,
  billImagePath: z.string().nullable().optional(),
});

export const VerificationReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().max(300).optional(),
});
