import { Router, type IRouter } from "express";

const router: IRouter = Router();

const creditPackages = [
  { id: "starter", name: "Starter", credits: 100, bonusCredits: 0, price: 9.99, popular: false, description: "Get started" },
  { id: "popular", name: "Popular", credits: 300, bonusCredits: 30, price: 24.99, popular: true, savings: "Save 17%", description: "Most popular choice" },
  { id: "value", name: "Value", credits: 600, bonusCredits: 90, price: 44.99, popular: false, savings: "Save 25%", description: "Great value" },
  { id: "premium", name: "Premium", credits: 1250, bonusCredits: 250, price: 84.99, popular: false, savings: "Save 32%", description: "Premium experience" },
  { id: "elite", name: "Elite", credits: 2500, bonusCredits: 600, price: 149.99, popular: false, savings: "Save 40%", description: "Elite status" },
  { id: "ultimate", name: "Ultimate", credits: 5000, bonusCredits: 1500, price: 274.99, popular: false, savings: "Save 45%", description: "Ultimate package" },
  { id: "vip", name: "VIP", credits: 10000, bonusCredits: 4000, price: 499.99, popular: false, savings: "Save 50%", description: "VIP experience" },
  { id: "diamond", name: "Diamond", credits: 25000, bonusCredits: 12500, price: 999.99, popular: false, savings: "Save 57%", description: "Diamond tier — the best" },
];

router.get("/credits/packages", (_req, res) => {
  res.json(creditPackages);
});

router.post("/credits/purchase", (req, res) => {
  const { packageId } = req.body;
  const pkg = creditPackages.find(p => p.id === packageId);
  
  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }
  
  const creditsAdded = pkg.credits + pkg.bonusCredits;
  
  res.json({
    success: true,
    creditsAdded,
    newBalance: 750 + creditsAdded, // mock balance
    transactionId: `TXN-${Date.now()}`,
  });
});

router.post("/credits/unlock", (req, res) => {
  const { mediaItemId } = req.body;
  
  // Mock unlock — in production this would verify balance and update DB
  const creditCost = mediaItemId?.includes("video") ? 150 : 50;
  
  res.json({
    success: true,
    creditsSpent: creditCost,
    newBalance: 750 - creditCost,
    mediaUrl: `https://picsum.photos/seed/${mediaItemId}/800/600`,
  });
});

export default router;
