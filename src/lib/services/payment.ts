import { prisma } from "@/lib/db";
import type { PaymentMethod } from "@prisma/client";

// ---------------------------------------------------------------------------
// Payment gateway abstraction
// ---------------------------------------------------------------------------

export interface ChargeRequest {
  amount: number;
  currency: string;
  description: string;
  card?: { number: string; expMonth: number; expYear: number; cvc: string; last4: string };
}

export interface ChargeResult {
  success: boolean;
  transactionId?: string;
  providerName?: string;
  error?: string;
}

export interface PaymentGateway {
  readonly id: string;
  readonly available: boolean;
  charge(req: ChargeRequest): Promise<ChargeResult>;
}

/**
 * Local (demo) card gateway. Processes "card" payments without a real PSP.
 * Swap for StripeGateway below when STRIPE_SECRET_KEY is set.
 */
export class LocalCardGateway implements PaymentGateway {
  readonly id = "local";
  get available() {
    return true;
  }
  async charge(req: ChargeRequest): Promise<ChargeResult> {
    if (!req.card?.last4) return { success: false, error: "Card details missing" };
    return { success: true, transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`, providerName: "local" };
  }
}

export class StripeGateway implements PaymentGateway {
  readonly id = "stripe";
  get available() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }
  private client() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("stripe") as { Stripe: new (key: string) => unknown };
    return new mod.Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  async charge(): Promise<ChargeResult> {
    // Stripe integration point — a PaymentIntent is created from the server,
    // confirmed with the token from the client, then createPaymentForReservation
    // records the successful payment. See docs in README.md.
    throw new Error("Stripe gateway requires the stripe package and server-side flow");
  }
}

class PaypalGatewayStub implements PaymentGateway {
  readonly id = "paypal";
  get available() {
    return false;
  }
  async charge(): Promise<ChargeResult> {
    return { success: false, error: "PayPal not configured" };
  }
}

export function getPaymentGateway(method: PaymentMethod): PaymentGateway {
  switch (method) {
    case "STRIPE":
      return new StripeGateway();
    case "PAYPAL":
      return new PaypalGatewayStub();
    case "CARD":
      return new LocalCardGateway();
    default:
      return new LocalCardGateway();
  }
}

const CARD_NUMBER_RE = /^\d{16}$/;

export function validateCardNumber(number: string): { valid: boolean; last4?: string } {
  const digits = number.replace(/\s+/g, "");
  if (!CARD_NUMBER_RE.test(digits)) return { valid: false };
  // Luhn check
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  if (sum % 10 !== 0) return { valid: false };
  return { valid: true, last4: digits.slice(-4) };
}

// ---------------------------------------------------------------------------
// Record payments
// ---------------------------------------------------------------------------

export async function createPaymentRecord(input: {
  reservationId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status?: "PENDING" | "PAID";
  transactionId?: string;
  provider?: string;
  cardLast4?: string;
}) {
  return prisma.payment.create({
    data: {
      reservationId: input.reservationId,
      customerId: input.customerId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      provider: input.provider,
      transactionId: input.transactionId,
      cardLast4: input.cardLast4,
      status: input.status ?? "PENDING",
      paidAt: input.status === "PAID" ? new Date() : null,
    },
  });
}

export async function processCardPayment(input: {
  reservationId: string;
  customerId: string;
  amount: number;
  currency: string;
  card: { number: string; expMonth: number; expYear: number; cvc: string };
}) {
  const check = validateCardNumber(input.card.number);
  if (!check.valid || !check.last4) {
    throw new Error("Invalid credit card number.");
  }

  const gateway = getPaymentGateway("CARD");
  const result = await gateway.charge({
    amount: input.amount,
    currency: input.currency,
    description: `Reservation ${input.reservationId}`,
    card: { ...input.card, last4: check.last4 },
  });
  if (!result.success) throw new Error(result.error ?? "Payment failed.");

  const payment = await prisma.payment.create({
    data: {
      reservationId: input.reservationId,
      customerId: input.customerId,
      amount: input.amount,
      currency: input.currency,
      method: "CARD",
      provider: result.providerName ?? "local",
      transactionId: result.transactionId,
      cardLast4: check.last4, // masked — we never store full card numbers
      status: "PAID",
      paidAt: new Date(),
    },
  });

  await prisma.reservation.update({
    where: { id: input.reservationId },
    data: { paymentStatus: "PAID" },
  });

  return payment;
}

export async function recordPayAtHostelPayment(input: {
  reservationId: string;
  customerId: string;
  amount: number;
  currency: string;
}) {
  return prisma.payment.create({
    data: {
      reservationId: input.reservationId,
      customerId: input.customerId,
      amount: input.amount,
      currency: input.currency,
      method: "PAY_AT_HOSTEL",
      status: "PENDING",
    },
  });
}

export async function refundPayment(paymentId: string, amount: number, reason?: string, processedById?: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "PAID") throw new Error("Payment is not in a refundable state");

    if (amount >= payment.amount) {
      await tx.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED" } });
      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: { paymentStatus: "REFUNDED" },
      });
    } else {
      await tx.payment.update({ where: { id: paymentId }, data: { status: "PARTIALLY_REFUNDED" } });
      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: { paymentStatus: "PARTIALLY_REFUNDED" },
      });
    }

    return tx.refund.create({
      data: {
        paymentId,
        amount,
        currency: payment.currency,
        reason,
        status: "COMPLETED",
        processedById: processedById ?? null,
      },
    });
  });
}