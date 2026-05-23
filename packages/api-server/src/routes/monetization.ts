import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreditPurchaseSchema, UnlockContentSchema } from '../schemas/monetization.js';
import { validateRequest } from '../middleware/validate.js';
import { generateCCBillPaymentUrl, verifyCCBillSignature } from '../services/ccbill.js';

const prisma = new PrismaClient();
const router = Router();

// CCBill Purchase - redirects to CCBill hosted page
router.post('/credits/purchase', validateRequest(CreditPurchaseSchema), async (req, res) => {
  const { amount, paymentMethod } = req.body;
  const userId = 'temp-user-id'; // replace with real auth later

  // Create pending transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      amount,
      type: 'purchase',
      status: 'pending',
      paymentMethod: 'ccbill'
    }
  });

  // Generate CCBill payment URL
  const paymentUrl = generateCCBillPaymentUrl(amount, userId);
  res.redirect(paymentUrl);
});

// CCBill Webhook (Data Link)
router.post('/ccbill/webhook', async (req, res) => {
  const data = req.body;

  if (!verifyCCBillSignature(data)) {
    console.error('CCBill signature verification failed');
    return res.status(400).send('Invalid signature');
  }

  if (data.status === '1' || data.approvalStatus === '1') { // success
    const userId = data['x-userId'] || 'temp-user-id';
    const credits = parseInt(data['x-credits'] || '0');

    await prisma.transaction.updateMany({
      where: { userId, status: 'pending' },
      data: { status: 'success' }
    });

    await prisma.user.upsert({
      where: { id: userId },
      update: { credits: { increment: credits } },
      create: { username: 'temp-user', credits }
    });

    console.log(\ CCBill payment successful - added \ credits to \\);
  }

  res.status(200).send('OK');
});

// Get balance
router.get('/credits/balance', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: 'temp-user-id' } });
  res.json({ balance: user?.credits ?? 0 });
});

// Unlock (unchanged)
router.post('/unlock', validateRequest(UnlockContentSchema), async (req, res) => {
  const { contentId, contentType } = req.body;
  await prisma.contentUnlock.create({
    data: { userId: 'temp-user-id', contentId, contentType }
  });
  res.json({ success: true, unlocked: true });
});

export default router;
