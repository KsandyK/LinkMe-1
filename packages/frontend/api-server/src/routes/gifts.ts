import { Router, type IRouter } from "express";

const router: IRouter = Router();

const gifts = [
  { id: "rose", name: "Rose", emoji: "🌹", creditCost: 25, description: "A classic symbol of love", category: "romantic", effect: "floating roses" },
  { id: "chocolate", name: "Chocolate Box", emoji: "🍫", creditCost: 50, description: "Sweet and indulgent", category: "sweet", effect: "chocolates rain" },
  { id: "champagne", name: "Champagne", emoji: "🍾", creditCost: 100, description: "Celebrate in style", category: "luxury", effect: "bubbles pop" },
  { id: "diamond-ring", name: "Diamond Ring", emoji: "💍", creditCost: 200, description: "A sparkling statement", category: "luxury", effect: "sparkle burst" },
  { id: "luxury-bag", name: "Luxury Bag", emoji: "👜", creditCost: 300, description: "Designer chic", category: "fashion", effect: "confetti" },
  { id: "sports-car", name: "Sports Car", emoji: "🏎️", creditCost: 500, description: "Vroom vroom!", category: "ultimate", effect: "turbo boost" },
  { id: "yacht", name: "Yacht", emoji: "🛥️", creditCost: 1000, description: "Life on the water", category: "ultimate", effect: "wave splash" },
  { id: "private-jet", name: "Private Jet", emoji: "✈️", creditCost: 2000, description: "First class everywhere", category: "ultimate", effect: "skywriting" },
  { id: "crown", name: "Crown", emoji: "👑", creditCost: 150, description: "Treat them like royalty", category: "prestige", effect: "crown shimmer" },
  { id: "heart-explosion", name: "Heart Explosion", emoji: "💥❤️", creditCost: 75, description: "Burst with love", category: "romantic", effect: "heart burst" },
  { id: "fire", name: "Fire", emoji: "🔥", creditCost: 40, description: "They're on fire!", category: "fun", effect: "fire trail" },
  { id: "kiss", name: "Kiss", emoji: "💋", creditCost: 30, description: "Send a virtual kiss", category: "romantic", effect: "lipstick marks" },
  { id: "vip-pass", name: "VIP Pass", emoji: "🎫", creditCost: 250, description: "Grant exclusive access", category: "prestige", effect: "golden glow" },
  { id: "golden-trophy", name: "Golden Trophy", emoji: "🏆", creditCost: 400, description: "You're a winner!", category: "prestige", effect: "trophy shine" },
  { id: "angel-wings", name: "Angel Wings", emoji: "👼", creditCost: 600, description: "Heavenly vibes", category: "ultimate", effect: "wing flutter" },
  { id: "galaxy", name: "Galaxy", emoji: "🌌", creditCost: 800, description: "Out of this world", category: "ultimate", effect: "galaxy swirl" },
];

router.get("/gifts", (_req, res) => {
  res.json(gifts);
});

router.post("/gifts/send", (req, res) => {
  const { giftId, recipientId } = req.body;
  
  if (!giftId || !recipientId) {
    res.status(400).json({ error: "giftId and recipientId required" });
    return;
  }
  
  const gift = gifts.find(g => g.id === giftId);
  if (!gift) {
    res.status(404).json({ error: "Gift not found" });
    return;
  }
  
  res.json({
    success: true,
    creditsSpent: gift.creditCost,
    newBalance: 750 - gift.creditCost,
    giftId,
  });
});

export default router;
