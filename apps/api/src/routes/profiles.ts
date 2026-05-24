import { Router, type IRouter } from "express";
import { GetProfilesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profiles", (_req, res) => {
  res.json([] as unknown as typeof GetProfilesResponse);
});

export default router;
