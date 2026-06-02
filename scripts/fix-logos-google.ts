import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Google Favicon API — תמיד עובד, ללא CORS, חינמי
// https://www.google.com/s2/favicons?domain=openai.com&sz=64
const LOGOS: Record<string, string> = {
  "ChatGPT":          "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64",
  "Claude":           "https://www.google.com/s2/favicons?domain=anthropic.com&sz=64",
  "DALL-E 3":         "https://www.google.com/s2/favicons?domain=openai.com&sz=64",
  "Sora":             "https://www.google.com/s2/favicons?domain=openai.com&sz=64",
  "Midjourney":       "https://www.google.com/s2/favicons?domain=midjourney.com&sz=64",
  "Cursor":           "https://www.google.com/s2/favicons?domain=cursor.sh&sz=64",
  "GitHub Copilot":   "https://www.google.com/s2/favicons?domain=github.com&sz=64",
  "Copilot":          "https://www.google.com/s2/favicons?domain=github.com&sz=64",
  "Perplexity AI":    "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64",
  "You.com":          "https://www.google.com/s2/favicons?domain=you.com&sz=64",
  "Jasper AI":        "https://www.google.com/s2/favicons?domain=jasper.ai&sz=64",
  "Jasper":           "https://www.google.com/s2/favicons?domain=jasper.ai&sz=64",
  "ElevenLabs":       "https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=64",
  "Gemini":           "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64",
  "Notion AI":        "https://www.google.com/s2/favicons?domain=notion.so&sz=64",
  "Grammarly":        "https://www.google.com/s2/favicons?domain=grammarly.com&sz=64",
  "Canva AI":         "https://www.google.com/s2/favicons?domain=canva.com&sz=64",
  "Stable Diffusion": "https://www.google.com/s2/favicons?domain=stability.ai&sz=64",
  "Runway":           "https://www.google.com/s2/favicons?domain=runwayml.com&sz=64",
  "Synthesia":        "https://www.google.com/s2/favicons?domain=synthesia.io&sz=64",
  "HeyGen":           "https://www.google.com/s2/favicons?domain=heygen.com&sz=64",
  "Suno":             "https://www.google.com/s2/favicons?domain=suno.com&sz=64",
  "Udio":             "https://www.google.com/s2/favicons?domain=udio.com&sz=64",
  "Leonardo AI":      "https://www.google.com/s2/favicons?domain=leonardo.ai&sz=64",
  "Replit":           "https://www.google.com/s2/favicons?domain=replit.com&sz=64",
  "Tabnine":          "https://www.google.com/s2/favicons?domain=tabnine.com&sz=64",
  "Copy.ai":          "https://www.google.com/s2/favicons?domain=copy.ai&sz=64",
  "Grok":             "https://www.google.com/s2/favicons?domain=x.ai&sz=64",
  "Meta AI":          "https://www.google.com/s2/favicons?domain=meta.ai&sz=64",
  "Mistral AI":       "https://www.google.com/s2/favicons?domain=mistral.ai&sz=64",
  "Gamma":            "https://www.google.com/s2/favicons?domain=gamma.app&sz=64",
  "Make":             "https://www.google.com/s2/favicons?domain=make.com&sz=64",
  "Zapier":           "https://www.google.com/s2/favicons?domain=zapier.com&sz=64",
  "Webflow AI":       "https://www.google.com/s2/favicons?domain=webflow.com&sz=64",
  "Bubble":           "https://www.google.com/s2/favicons?domain=bubble.io&sz=64",
  "Surfer SEO":       "https://www.google.com/s2/favicons?domain=surferseo.com&sz=64",
  "Semrush AI":       "https://www.google.com/s2/favicons?domain=semrush.com&sz=64",
  "Adobe Firefly":    "https://www.google.com/s2/favicons?domain=adobe.com&sz=64",
  "Beautiful.ai":     "https://www.google.com/s2/favicons?domain=beautiful.ai&sz=64",
  "Otter.ai":         "https://www.google.com/s2/favicons?domain=otter.ai&sz=64",
  "Reclaim AI":       "https://www.google.com/s2/favicons?domain=reclaim.ai&sz=64",
  "Khanmigo":         "https://www.google.com/s2/favicons?domain=khanacademy.org&sz=64",
  "AdCreative.ai":    "https://www.google.com/s2/favicons?domain=adcreative.ai&sz=64",
  "Bloomberg GPT":    "https://www.google.com/s2/favicons?domain=bloomberg.com&sz=64",
  "Harvey AI":        "https://www.google.com/s2/favicons?domain=harvey.ai&sz=64",
  "Ironclad AI":      "https://www.google.com/s2/favicons?domain=ironcladapp.com&sz=64",
  "Kensho":           "https://www.google.com/s2/favicons?domain=kensho.com&sz=64",
  "Nabla Copilot":    "https://www.google.com/s2/favicons?domain=nabla.com&sz=64",
  "Suki AI":          "https://www.google.com/s2/favicons?domain=suki.ai&sz=64",
  "Intercom AI":      "https://www.google.com/s2/favicons?domain=intercom.com&sz=64",
  "Tidio":            "https://www.google.com/s2/favicons?domain=tidio.com&sz=64",
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
