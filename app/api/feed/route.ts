import { getDb } from "@/lib/db";
import { createFeedHandler } from "@/lib/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createFeedHandler(getDb);
