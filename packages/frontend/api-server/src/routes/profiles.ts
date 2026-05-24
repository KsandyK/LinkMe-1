import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { profilesTable, mediaItemsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, like, or, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/profiles", async (req, res) => {
  try {
    const { gender, ageMin, ageMax, location, isLive, search } = req.query;
    
    let conditions: ReturnType<typeof eq>[] = [];
    
    if (gender && typeof gender === "string") {
      conditions.push(eq(profilesTable.gender, gender));
    }
    if (ageMin) {
      conditions.push(gte(profilesTable.age, Number(ageMin)));
    }
    if (ageMax) {
      conditions.push(lte(profilesTable.age, Number(ageMax)));
    }
    if (isLive !== undefined) {
      conditions.push(eq(profilesTable.isLive, isLive === "true"));
    }

    const profiles = await db.select({
      id: profilesTable.id,
      username: profilesTable.username,
      displayName: profilesTable.displayName,
      age: profilesTable.age,
      location: profilesTable.location,
      gender: profilesTable.gender,
      isLive: profilesTable.isLive,
      isCreator: profilesTable.isCreator,
      avatarUrl: profilesTable.avatarUrl,
      coverUrl: profilesTable.coverUrl,
      tagline: profilesTable.tagline,
      viewerCount: profilesTable.viewerCount,
      badges: profilesTable.badges,
      tier: profilesTable.tier,
      rating: profilesTable.rating,
      totalEarnings: profilesTable.totalEarnings,
    }).from(profilesTable).where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(profiles);
  } catch (err) {
    req.log.error({ err }, "Error fetching profiles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/profiles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, id));
    
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    
    const mediaItems = await db.select().from(mediaItemsTable).where(eq(mediaItemsTable.profileId, id));
    
    const profileDetail = {
      ...profile,
      mediaItems: mediaItems.map(item => ({
        id: item.id,
        type: item.type,
        thumbnailUrl: item.thumbnailUrl,
        isLocked: item.isLocked,
        creditCost: item.creditCost,
        title: item.title,
      })),
      sexualPreferences: {
        orientation: profile.sexualOrientation || "Private",
        lockedDetails: "Unlock to view intimate preferences, turn-ons, turn-offs and fantasies",
      },
    };
    
    res.json(profileDetail);
  } catch (err) {
    req.log.error({ err }, "Error fetching profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
