import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import livefeedsRouter from "./livefeeds";
import creditsRouter from "./credits";
import messagesRouter from "./messages";
import giftsRouter from "./gifts";
import boostsRouter from "./boosts";
import creatorRouter from "./creator";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(livefeedsRouter);
router.use(creditsRouter);
router.use(messagesRouter);
router.use(giftsRouter);
router.use(boostsRouter);
router.use(creatorRouter);

export default router;
