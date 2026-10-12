"use client";

import { useCallback, useRef } from "react";
import { trackToolUse } from "./analytics";

/**
 * Returns a `markUsed` callback that fires a single `tool_use` analytics event
 * the first time it is called in this mount — call it from a tool's primary
 * interaction handler (onChange / onClick / copy / download). Subsequent calls
 * are no-ops, so it is safe to call on every keystroke.
 */
export function useToolUsage(toolSlug: string): () => void {
  const fired = useRef(false);
  return useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    trackToolUse(toolSlug);
  }, [toolSlug]);
}
