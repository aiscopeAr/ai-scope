/**
 * Adds service account to GA4 using your personal Google account (OAuth)
 * npx tsx scripts/add-ga4-service-account.ts
 */
import { google } = require("googleapis");
import * as http from "http";
import * as url from "url";
import * as open from "open";

const SERVICE_ACCOUNT_EMAIL = "lumiq-analytics@lumiq-497613.iam.gserviceaccount.com";
const GA4_PROPERTY_ID = "properties/538064799";

// OAuth2 client — use Google Cloud Console OAuth credentials
const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  "http://localhost:3001/callback"
);

const scopes = ["https://www.googleapis.com/auth/analytics.manage.users"];

async function main() {
  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({ scope: scopes });
  console.log("Opening browser for Google login...");
  console.log("Auth URL:", authUrl);

  // Start local server to catch callback
  const code = await new Promise<string>((resolve) => {
    const server = http.createServer((req, res) => {
      const qs = new url.URL(req.url!, "http://localhost:3001").searchParams;
      const code = qs.get("code");
      res.end("Done! You can close this tab.");
      server.close();
      resolve(code!);
    });
    server.listen(3001);
  });

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const analyticsAdmin = google.analyticsadmin({ version: "v1alpha", auth: oauth2Client });

  try {
    const res = await analyticsAdmin.properties.accessBindings.create({
      parent: GA4_PROPERTY_ID,
      requestBody: {
        user: SERVICE_ACCOUNT_EMAIL,
        roles: ["roles/viewer"],
      },
    });
    console.log("✅ Service account added successfully:", res.data);
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

main();
