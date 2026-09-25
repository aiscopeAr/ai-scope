/**
 * scripts/verify-ga4-access.ts
 *
 * READ-ONLY GA4 access verification for audit tooling. Resolves the configured
 * property id (canonical GA_PROPERTY_ID, legacy GA4_PROPERTY_ID), performs a
 * minimal direct property read (properties.get + getMetadata + a 1-metric
 * runReport), and classifies the outcome via the shared classifier.
 *
 * It NEVER changes GA4 configuration or permissions and never prints credentials.
 * The direct property request is the source of truth; an empty
 * accountSummaries.list is expected under property-level access and is not used
 * as a verdict input.
 *
 *   node --env-file=.env --import tsx scripts/verify-ga4-access.ts
 */
import { google } from "googleapis";
import { resolveCredentials } from "../lib/gsc";
import {
  resolveGa4PropertyId,
  classifyGa4Access,
  Ga4ConfigError,
  type Ga4DirectRequestOutcome,
} from "../lib/ga4-property";

async function main() {
  // 1-2. Resolve + normalize the configured property id (fail-closed on config errors).
  let prop;
  try {
    prop = resolveGa4PropertyId();
  } catch (e) {
    const code = e instanceof Ga4ConfigError ? e.code : undefined;
    const verdict = classifyGa4Access({ propertyIdConfigured: false, configError: code });
    console.log(JSON.stringify({ verdict: verdict.code, message: verdict.message }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(`canonical key: ${prop.sourceKey} | numericId: ${prop.numericId} | resource: ${prop.resourceName}`);

  const { clientEmail, privateKey } = resolveCredentials() as { clientEmail: string; privateKey: string };
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const data = google.analyticsdata({ version: "v1beta", auth });
  const admin = google.analyticsadmin({ version: "v1beta", auth });

  // 3. Minimal DIRECT read-only property requests.
  const direct: Ga4DirectRequestOutcome = { ok: false };
  let displayName = "";
  try {
    const meta: { data?: { displayName?: string } } = await admin.properties.get({ name: prop.resourceName });
    displayName = meta.data?.displayName ?? "";
    await data.properties.getMetadata({ name: `${prop.resourceName}/metadata` });
    await data.properties.runReport({
      property: prop.resourceName,
      requestBody: { dateRanges: [{ startDate: "2026-09-16", endDate: "2026-09-22" }], metrics: [{ name: "sessions" }] },
    });
    direct.ok = true;
  } catch (e: unknown) {
    const err = (e as { errors?: Array<{ message?: string }>; code?: number; message?: string });
    direct.status = err.code;
    const m = err.errors?.[0]?.message || err.message || "";
    direct.apiDisabled = /disabled|has not been used/i.test(m);
    // Only a sanitized slice; no credentials are ever present in GA API messages.
    console.log(`direct request failed: status=${direct.status} ${m.slice(0, 120)}`);
  }

  // 4-5. Single verdict from the shared classifier.
  const verdict = classifyGa4Access({ propertyIdConfigured: true, direct });
  console.log(
    JSON.stringify(
      { property: prop.resourceName, displayName, directOk: direct.ok, verdict: verdict.code, message: verdict.message },
      null,
      2,
    ),
  );
  process.exitCode = verdict.code === "PROPERTY_LEVEL_ACCESS_OK" ? 0 : 1;
}

main().catch((e: unknown) => {
  console.log(`UNEXPECTED: ${(e as Error)?.message?.slice(0, 160) ?? String(e)}`);
  process.exitCode = 1;
});
