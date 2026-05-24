import { Router, type IRouter } from "express";

const router: IRouter = Router();

const boostPackages = [
  {
    id: "spark",
    name: "Spark",
    boostsPerMonth: 5,
    price: 9.99,
    description: "Get noticed with regular boosts",
    features: ["5 profile boosts/month", "Priority in search results", "Boost notification to followers", "Basic analytics"],
    popular: false,
  },
  {
    id: "flame",
    name: "Flame",
    boostsPerMonth: 12,
    price: 19.99,
    description: "Stay hot with consistent visibility",
    features: ["12 profile boosts/month", "Top search placement", "Featured on Live Feeds page", "Full analytics dashboard", "Boost scheduling"],
    popular: true,
  },
  {
    id: "inferno",
    name: "Inferno",
    boostsPerMonth: 20,
    price: 34.99,
    description: "Maximum exposure for serious creators",
    features: ["20 profile boosts/month", "Homepage featured spot", "Category top placement", "Premium analytics + insights", "Priority support", "Boost scheduling & automation"],
    popular: false,
  },
  {
    id: "legend",
    name: "Legend",
    boostsPerMonth: 35,
    price: 59.99,
    description: "VIP tier maximum — 35 boosts/month",
    features: ["35 boosts/month (MAX)", "Homepage shoutout", "Featured in email newsletters", "VIP badge on profile", "Dedicated account manager", "Custom boost scheduling", "Revenue analytics"],
    popular: false,
  },
];

router.get("/boosts", (_req, res) => {
  res.json(boostPackages);
});

export default router;
