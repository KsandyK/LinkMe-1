import { Router } from 'express';
import { CreditPurchaseSchema, UnlockContentSchema } from '../schemas/monetization.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

// Buy credits
router.post('/credits/purchase', validateRequest(CreditPurchaseSchema), async (req, res) => {
  res.json({ success: true, creditsAdded: req.body.amount, transactionId: 'TEMP-' + Date.now() });
});

// Unlock content
router.post('/unlock', validateRequest(UnlockContentSchema), async (req, res) => {
  res.json({ success: true, unlocked: true });
});

// Get balance (stub)
router.get('/credits/balance', (req, res) => {
  res.json({ balance: 2500 });
});

// Webhook stub (CCBill/Stripe ready)
router.post('/webhook', async (req, res) => {
  res.status(200).send('OK');
});

export default router;
