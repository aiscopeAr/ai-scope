import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Using Clearbit Logo API (free, reliable, no CORS) + Wikipedia SVGs
// Format: https://logo.clearbit.com/{domain}
const LOGOS: Record<string, string> = {
  "ChatGPT":          "https://logo.clearbit.com/openai.com",
  "Claude":           "https://logo.clearbit.com/anthropic.com",
  "DALL-E 3":         "https://logo.clearbit.com/openai.com",
  "Sora":             "https://logo.clearbit.com/openai.com",
  "Midjourney":       "https://logo.clearbit.com/midjourney.com",
  "Cursor":           "https://logo.clearbit.com/cursor.sh",
  "GitHub Copilot":   "https://logo.clearbit.com/github.com",
  "Copilot":          "https://logo.clearbit.com/github.com",
  "Perplexity AI":    "https://logo.clearbit.com/perplexity.ai",
  "You.com":          "https://logo.clearbit.com/you.com",
  "Jasper AI":        "https://logo.clearbit.com/jasper.ai",
  "Jasper":           "https://logo.clearbit.com/jasper.ai",
  "ElevenLabs":       "https://logo.clearbit.com/elevenlabs.io",
  "Gemini":           "https://logo.clearbit.com/google.com",
  "Notion AI":        "https://logo.clearbit.com/notion.so",
  "Grammarly":        "https://logo.clearbit.com/grammarly.com",
  "Canva AI":         "https://logo.clearbit.com/canva.com",
  "Stable Diffusion": "https://logo.clearbit.com/stability.ai",
  "Runway":           "https://logo.clearbit.com/runwayml.com",
  "Synthesia":        "https://logo.clearbit.com/synthesia.io",
  "HeyGen":           "https://logo.clearbit.com/heygen.com",
  "Suno":             "https://logo.clearbit.com/suno.com",
  "Udio":             "https://logo.clearbit.com/udio.com",
  "Leonardo AI":      "https://logo.clearbit.com/leonardo.ai",
  "Replit":           "https://logo.clearbit.com/replit.com",
  "Tabnine":          "https://logo.clearbit.com/tabnine.com",
  "Copy.ai":          "https://logo.clearbit.com/copy.ai",
  "Grok":             "https://logo.clearbit.com/x.ai",
  "Meta AI":          "https://logo.clearbit.com/meta.com",
  "Mistral AI":       "https://logo.clearbit.com/mistral.ai",
  "Gamma":            "https://logo.clearbit.com/gamma.app",
  "Make":             "https://logo.clearbit.com/make.com",
  "Zapier":           "https://logo.clearbit.com/zapier.com",
  "Webflow AI":       "https://logo.clearbit.com/webflow.com",
  "Bubble":           "https://logo.clearbit.com/bubble.io",
  "Surfer SEO":       "https://logo.clearbit.com/surferseo.com",
  "Semrush AI":       "https://logo.clearbit.com/semrush.com",
  "Adobe Firefly":    "https://logo.clearbit.com/adobe.com",
  "Beautiful.ai":     "https://logo.clearbit.com/beautiful.ai",
  "Otter.ai":         "https://logo.clearbit.com/otter.ai",
  "Reclaim AI":       "https://logo.clearbit.com/reclaim.ai",
  "Khanmigo":         "https://logo.clearbit.com/khanacademy.org",
  "AdCreative.ai":    "https://logo.clearbit.com/adcreative.ai",
  "Bloomberg GPT":    "https://logo.clearbit.com/bloomberg.com",
  "Harvey AI":        "https://logo.clearbit.com/harvey.ai",
  "Ironclad AI":      "https://logo.clearbit.com/ironcladapp.com",
  "Kensho":           "https://logo.clearbit.com/kensho.com",
  "Nabla Copilot":    "https://logo.clearbit.com/nabla.com",
  "Suki AI":          "https://logo.clearbit.com/suki.ai",
  "Intercom AI":      "https://logo.clearbit.com/intercom.com",
  "Tidio":            "https://logo.clearbit.com/tidio.com",
};

async function main() {
  let updated = 0;
  for (const [name, logoUrl] of Object.entries(LOGOS)) {
    const result = await prisma.aITool.updateMany({
      where: { name },
      data: { logoUrl },
    });
    if (result.count > 0) {
      console.log(`✅ ${name}`);
      updated += result.count;
    }
  }
  console.log(`\nTotal updated: ${updated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
