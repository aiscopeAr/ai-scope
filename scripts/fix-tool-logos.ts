import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LOGOS: Record<string, string> = {
  "ChatGPT":          "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  "Claude":           "https://claude.ai/favicon.ico",
  "DALL-E 3":         "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
  "Midjourney":       "https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png",
  "Cursor":           "https://cursor.sh/brand/icon.svg",
  "GitHub Copilot":   "https://github.githubassets.com/images/modules/site/copilot/copilot-logo.png",
  "Perplexity AI":    "https://www.perplexity.ai/favicon.ico",
  "You.com":          "https://you.com/favicon.ico",
  "Jasper AI":        "https://assets-global.website-files.com/60e5f2de011b86acebc30db7/60e5f2de011b8678dbc30dce_jasper-logo.svg",
  "ElevenLabs":       "https://elevenlabs.io/favicon.ico",
  "Gemini":           "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  "Notion AI":        "https://www.notion.so/images/favicon.ico",
  "Grammarly":        "https://static.grammarly.com/assets/files/efe0f1c173ccc9ac5d15bc4d10c68b62/favicon.ico",
  "Canva AI":         "https://static.canva.com/web/images/favicon.ico",
  "Stable Diffusion": "https://stability.ai/favicon.ico",
  "Runway":           "https://runwayml.com/favicon.ico",
  "Synthesia":        "https://www.synthesia.io/favicon.ico",
  "HeyGen":           "https://www.heygen.com/favicon.ico",
  "Suno":             "https://suno.com/favicon.ico",
  "Udio":             "https://www.udio.com/favicon.ico",
  "Leonardo AI":      "https://leonardo.ai/favicon.ico",
  "Replit":           "https://replit.com/public/icons/favicon-196.png",
  "Tabnine":          "https://www.tabnine.com/favicon.ico",
  "Copy.ai":          "https://www.copy.ai/favicon.ico",
  "Jasper":           "https://assets-global.website-files.com/60e5f2de011b86acebc30db7/60e5f2de011b8678dbc30dce_jasper-logo.svg",
  "Grok":             "https://x.ai/favicon.ico",
  "Meta AI":          "https://static.xx.fbcdn.net/rsrc.php/v3/yb/r/NsajMXNGzMB.png",
  "Copilot":          "https://github.githubassets.com/images/modules/site/copilot/copilot-logo.png",
  "Mistral AI":       "https://mistral.ai/favicon.ico",
  "Gamma":            "https://gamma.app/favicon.ico",
  "Make":             "https://www.make.com/favicon.ico",
  "Zapier":           "https://cdn.zapier.com/zapier/images/favicon.ico",
  "Webflow AI":       "https://webflow.com/favicon.ico",
  "Bubble":           "https://bubble.io/favicon.ico",
  "Surfer SEO":       "https://surferseo.com/favicon.ico",
  "Semrush AI":       "https://www.semrush.com/favicon.ico",
  "Adobe Firefly":    "https://www.adobe.com/favicon.ico",
  "Beautiful.ai":     "https://www.beautiful.ai/favicon.ico",
  "Canva":            "https://static.canva.com/web/images/favicon.ico",
  "Sora":             "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
  "Otter.ai":         "https://otter.ai/favicon.ico",
  "Reclaim AI":       "https://reclaim.ai/favicon.ico",
  "Khanmigo":         "https://www.khanacademy.org/favicon.ico",
  "AdCreative.ai":    "https://adcreative.ai/favicon.ico",
  "Bloomberg GPT":    "https://www.bloomberg.com/favicon.ico",
  "Harvey AI":        "https://harvey.ai/favicon.ico",
  "Ironclad AI":      "https://ironcladapp.com/favicon.ico",
  "Kensho":           "https://www.kensho.com/favicon.ico",
  "Nabla Copilot":    "https://www.nabla.com/favicon.ico",
  "Suki AI":          "https://www.suki.ai/favicon.ico",
  "Intercom AI":      "https://www.intercom.com/favicon.ico",
  "Tidio":            "https://www.tidio.com/favicon.ico",
};

async function main() {
  // 1. Fix logos for all tools
  let updated = 0;
  for (const [name, logoUrl] of Object.entries(LOGOS)) {
    const result = await prisma.aITool.updateMany({
      where: { name, logoUrl: null },
      data: { logoUrl },
    });
    if (result.count > 0) {
      console.log(`✅ Updated logo for: ${name}`);
      updated += result.count;
    }
  }
  console.log(`\nTotal updated: ${updated}`);

  // 2. Remove duplicates — keep the one with logoUrl, or the newest
  const tools = await prisma.aITool.findMany({ orderBy: { createdAt: "asc" } });
  const seen = new Map<string, string>(); // name -> id to keep

  for (const tool of tools) {
    const key = tool.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, tool.id);
    } else {
      // Prefer the one with a logo
      const existingId = seen.get(key)!;
      const existing = tools.find(t => t.id === existingId)!;
      if (!existing.logoUrl && tool.logoUrl) {
        // new one has logo, delete old
        seen.set(key, tool.id);
        await prisma.aITool.delete({ where: { id: existingId } }).catch(() => {});
        console.log(`🗑️  Removed duplicate (no logo): ${existing.name} [${existingId}]`);
      } else {
        // keep existing, delete new duplicate
        await prisma.aITool.delete({ where: { id: tool.id } }).catch(() => {});
        console.log(`🗑️  Removed duplicate: ${tool.name} [${tool.id}]`);
      }
    }
  }

  console.log("\n✅ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
