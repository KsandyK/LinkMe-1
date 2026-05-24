import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/gifts", (_req, res) => {
  res.json([]);
});

export default router;
