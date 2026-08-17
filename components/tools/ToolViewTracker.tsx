"use client";

import { useEffect } from "react";
import { trackToolView } from "@/lib/tools/analytics";

/** Fires the tool_view analytics event once on mount. No server call, no
 *  Prisma, no view-count persistence — deliberately lighter than the
 *  Review pipeline's ViewTracker (components/ViewTracker.tsx), which POSTs
 *  to /api/views/[slug] and writes to the database. Tools have no such
 *  table and don't need one for V1. */
export default function ToolViewTracker({ toolSlug }: { toolSlug: string }) {
  useEffect(() => {
    trackToolView(toolSlug);
  }, [toolSlug]);

  return null;
}
