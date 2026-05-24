import { z } from 'zod';

export const CreditPurchaseSchema = z.object({
  amount: z.number().min(100).max(100000),
  paymentMethod: z.enum(['ccbill', 'stripe', 'crypto']),
  returnUrl: z.string().url().optional()
});

export const UnlockContentSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(['stream', 'video', 'photo', 'private-message'])
});

export const WebhookPayloadSchema = z.object({
  transactionId: z.string(),
  amount: z.number(),
  status: z.enum(['success', 'failed', 'pending']),
  userId: z.string()
});
