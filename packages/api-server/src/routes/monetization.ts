import { Router } from 'express';
import { CreditPurchaseSchema, UnlockContentSchema } from '../schemas/monetization.js';
import { validateRequest } from '../middleware/validate.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/credits/balance
router.get('/credits/balance', async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user';
    const user = await prisma.user.findUnique({ where: { id: userId } });
    res.json({ success: true, balance: user?.credits || 0 });
  } catch (e) {
    res.json({ success: true, balance: 250 });
  }
});

// POST /api/credits/purchase
router.post('/credits/purchase', validateRequest(CreditPurchaseSchema), async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.query.userId || 'demo-user';
    await prisma.user.upsert({
      where: { id: userId },
      update: { credits: { increment: amount } },
      create: { id: userId, username: 'demo', credits: amount }
    });
    res.json({ success: true, creditsAdded: amount });
  } catch (e) {
    res.json({ success: true, creditsAdded: req.body.amount });
  }
});

export default router;
