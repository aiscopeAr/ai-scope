/**
 * app/api/admin/distribution/route.ts
 *
 * Minimal, read-only diagnostic endpoint for the Distribution Engine —
 * per Sprint 4's explicit "no redesign, no full partner management UI yet"
 * scope, this is a protected diagnostic route rather than a new admin
 * page. Session-gated the same way every other admin API route is
 * (lib/auth.ts's auth(), role === "admin").
 *
 * Never returns credentials — listTargetSummaries() doesn't even select
 * that column from the database (see lib/distribution/persistence/target.ts),
 * so there is no redaction step to get wrong; the shape returned here
 * simply has no field capable of carrying a credential value.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listTargetSummaries } from "@/lib/distribution/persistence/target";
import { getTaskCountsByTarget, getLastOutcomes } from "@/lib/distribution/persistence/task";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export interface DistributionTargetDiagnostic {
  id: string;
  name: string;
  targetType: string;
  enabled: boolean;
  pendingTasks: number;
  sentTasks: number;
  failedTasks: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summaries = await listTargetSummaries();

  const diagnostics: DistributionTargetDiagnostic[] = await Promise.all(
    summaries.map(async (target) => {
      const [counts, outcomes] = await Promise.all([getTaskCountsByTarget(target.id), getLastOutcomes(target.id)]);
      return {
        id: target.id,
        name: target.name,
        targetType: target.targetType,
        enabled: target.enabled,
        pendingTasks: counts.pending + counts.sending,
        sentTasks: counts.published,
        failedTasks: counts.failed,
        lastSuccessAt: outcomes.lastSuccessAt?.toISOString() ?? null,
        lastFailureAt: outcomes.lastFailureAt?.toISOString() ?? null,
      };
    }),
  );

  return NextResponse.json({ targets: diagnostics });
}
