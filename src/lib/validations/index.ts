import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "errors.minLen").max(60),
    lastName: z.string().min(2, "errors.minLen").max(60),
    email: z.string().email("errors.email").max(120),
    phone: z.string().min(6, "errors.phone").max(30).optional().or(z.literal("")),
    country: z.string().max(60).optional().or(z.literal("")),
    password: z.string().min(8, "errors.minLen").max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "auth.passwordsMismatch" });

export const loginSchema = z.object({
  email: z.string().email("errors.email"),
  password: z.string().min(1, "errors.required"),
  remember: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("errors.email"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "errors.minLen").max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "auth.passwordsMismatch" });

export const profileSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  phone: z.string().max(30).optional().or(z.literal("")),
  country: z.string().max(60).optional().or(z.literal("")),
  locale: z.string().default("en"),
  currency: z.string().default("DZD"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "auth.passwordsMismatch" });

export const reservationInputSchema = z.object({
  hostelId: z.string().min(1),
  roomId: z.string().min(1),
  checkIn: z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)),
  checkOut: z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)),
  guests: z.number().int().min(1).max(20),
  rooms: z.number().int().min(1).max(5).default(1),
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  email: z.string().email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  country: z.string().max(60).optional().or(z.literal("")),
  specialRequests: z.string().max(1000).optional().or(z.literal("")),
  paymentMethod: z.enum(["CARD", "PAY_AT_HOSTEL"]),
  cardNumber: z.string().optional().or(z.literal("")),
  cardName: z.string().optional().or(z.literal("")),
  cardExpiry: z.string().optional().or(z.literal("")),
  cardCvc: z.string().optional().or(z.literal("")),
  promoCode: z.string().optional().or(z.literal("")),
  guestNames: z.array(z.object({ fullName: z.string().max(120), age: z.number().int().min(0).max(120).nullable() })).optional(),
});

export const hostelSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).optional(),
  description: z.string().min(10).max(8000),
  address: z.string().min(3).max(255),
  city: z.string().min(1).max(90),
  country: z.string().min(1).max(90),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().max(200).optional().or(z.literal("")),
  checkInTime: z.string().default("14:00"),
  checkOutTime: z.string().default("11:00"),
  imageCover: z.string().optional().or(z.literal("")),
  images: z.array(z.string()).optional(),
  houseRules: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  seoTitle: z.string().max(160).optional().or(z.literal("")),
  metaDescription: z.string().max(300).optional().or(z.literal("")),
  status: z.string().default("ACTIVE"),
  featured: z.coerce.boolean().optional(),
});

export const roomSchema = z.object({
  hostelId: z.string().min(1),
  name: z.string().min(2).max(120),
  number: z.string().min(1).max(20),
  type: z.enum(["DORMITORY", "PRIVATE", "DOUBLE", "TWIN", "TRIPLE", "FAMILY", "SUITE"]),
  description: z.string().max(3000).optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(1).max(50),
  beds: z.coerce.number().int().min(1).max(50),
  bedType: z.enum(["SINGLE", "DOUBLE", "QUEEN", "KING", "BUNK", "SOFA"]),
  bathroomType: z.enum(["PRIVATE", "SHARED", "ENSUITE"]),
  pricePerNight: z.coerce.number().positive(),
  cleaningFee: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  minStay: z.coerce.number().int().min(1).max(365).default(1),
  maxStay: z.coerce.number().int().min(1).max(365).default(30),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  status: z.string().default("ACTIVE"),
});

export const promotionSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(30),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(1).max(100).optional(),
  fixedDiscount: z.coerce.number().min(1).optional(),
  minNights: z.coerce.number().int().min(0).default(1),
  minAmount: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  applicableHostels: z.array(z.string()).optional(),
  applicableRooms: z.array(z.string()).optional(),
  status: z.string().default("ACTIVE"),
});

export const reviewSchema = z.object({
  reservationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().or(z.literal("")),
  cleanliness: z.number().int().min(1).max(5),
  location: z.number().int().min(1).max(5),
  staff: z.number().int().min(1).max(5),
  comfort: z.number().int().min(1).max(5),
  facilities: z.number().int().min(1).max(5),
});

export const reservationAdminSchema = z.object({
  customerId: z.string().min(1),
  hostelId: z.string().min(1),
  roomId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.coerce.number().int().min(1),
  rooms: z.coerce.number().int().min(1).max(5).default(1),
  paymentMethod: z.enum(["CARD", "PAY_AT_HOSTEL", "STRIPE"]).default("PAY_AT_HOSTEL"),
  paymentStatus: z.enum(["PENDING", "PAID"]).default("PENDING"),
  status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN"]).default("CONFIRMED"),
  specialRequests: z.string().max(1000).optional().or(z.literal("")),
});

export const settingsSiteSchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(255),
  logo: z.string().max(500).optional().or(z.literal("")),
  favicon: z.string().max(500).optional().or(z.literal("")),
  contactEmail: z.string().email().max(150),
  phone: z.string().max(60),
  address: z.string().max(255),
  facebook: z.string().max(300).optional().or(z.literal("")),
  instagram: z.string().max(300).optional().or(z.literal("")),
  twitter: z.string().max(300).optional().or(z.literal("")),
});

export const settingsBrandSchema = z.object({
  primary: z.string().max(30),
  primaryDark: z.string().max(30),
  accent: z.string().max(30),
  accentDark: z.string().max(30),
});

export const settingsGeneralSchema = z.object({
  defaultCurrency: z.string().max(8),
  supportedCurrencies: z.array(z.string()),
  defaultLocale: z.enum(["en", "fr", "ar"]),
  supportedLocales: z.array(z.enum(["en", "fr", "ar"])),
  timezone: z.string().max(64),
});

export const settingsReservationsSchema = z.object({
  autoConfirm: z.coerce.boolean(),
  minNights: z.coerce.number().int().min(1),
  maxNights: z.coerce.number().int().min(1),
  maxGuestsPerRoom: z.coerce.number().int().min(1),
});

export const settingsPaymentsSchema = z.object({
  payAtHostelEnabled: z.coerce.boolean(),
  cardEnabled: z.coerce.boolean(),
  stripeEnabled: z.coerce.boolean(),
});

export const settingsTaxSchema = z.object({
  rate: z.coerce.number().min(0).max(100),
  label: z.string().max(120),
  applyCleaningFee: z.coerce.boolean(),
});

export const settingsCancellationSchema = z.object({
  policy: z.string().max(60),
  freeUntilDays: z.coerce.number().int().min(0),
  refundPercentage: z.coerce.number().int().min(0).max(100),
  text: z.string().max(1000),
});