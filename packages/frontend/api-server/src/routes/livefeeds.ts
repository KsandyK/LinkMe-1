import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { liveFeedsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/livefeeds", async (req, res) => {
  try {
    const { category, sortBy } = req.query;
    
    let conditions: ReturnType<typeof eq>[] = [
      eq(liveFeedsTable.isActive, true)
    ];
    
    if (category && typeof category === "string" && category !== "all") {
      conditions.push(eq(liveFeedsTable.category, category));
    }
    
    const feeds = await db.select().from(liveFeedsTable).where(and(...conditions)).orderBy(desc(liveFeedsTable.viewerCount));
    
    res.json(feeds);
  } catch (err) {
    req.log.error({ err }, "Error fetching live feeds");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/livefeeds/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [feed] = await db.select().from(liveFeedsTable).where(eq(liveFeedsTable.id, id));
    
    if (!feed) {
      res.status(404).json({ error: "Live feed not found" });
      return;
    }
    
    res.json(feed);
  } catch (err) {
    req.log.error({ err }, "Error fetching live feed" );
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
