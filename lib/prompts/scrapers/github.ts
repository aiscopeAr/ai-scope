export interface RawPrompt {
  rawTitle: string;
  rawPrompt: string;
  rawCategory: string;
  rawTags: string[];
  sourceUrl: string;
  sourceName: string;
}

export async function scrapeAwesomePrompts(): Promise<RawPrompt[]> {
  try {
    // Use raw GitHub URL — no Octokit dependency needed
    const res = await fetch(
      "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv",
      { next: { revalidate: 0 } }
    );

    if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);

    const csv = await res.text();
    const lines = csv.split("\n").slice(1); // skip header

    const prompts: RawPrompt[] = lines
      .filter((line) => line.trim().length > 10)
      .map((line) => {
        // CSV format: "act","prompt"
        const match = line.match(/^"([^"]*?)","([\s\S]*?)"?\s*$/);
        if (!match) return null;
        const [, act, prompt] = match;
        if (!act || !prompt || prompt.length < 50) return null;

        return {
          rawTitle: act.trim(),
          rawPrompt: prompt.trim(),
          rawCategory: categorizePrompt(act),
          rawTags: extractTags(prompt),
          sourceUrl: "https://github.com/f/awesome-chatgpt-prompts",
          sourceName: "Awesome ChatGPT Prompts",
        };
      })
      .filter((p): p is RawPrompt => p !== null);

    return prompts;
  } catch (error) {
    console.error("[prompts/github] Scrape error:", error instanceof Error ? error.message : error);
    return [];
  }
}

function categorizePrompt(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("code") || t.includes("program") || t.includes("developer") || t.includes("debug") || t.includes("sql")) return "coding";
  if (t.includes("market") || t.includes("advertis") || t.includes("seo") || t.includes("sales")) return "marketing";
  if (t.includes("design") || t.includes("logo") || t.includes("ui") || t.includes("ux")) return "design";
  if (t.includes("business") || t.includes("strategy") || t.includes("finance") || t.includes("invest")) return "business";
  if (t.includes("teach") || t.includes("tutor") || t.includes("learn") || t.includes("explain")) return "education";
  return "writing";
}

function extractTags(prompt: string): string[] {
  const tags: string[] = [];
  const lower = prompt.toLowerCase();
  if (lower.includes("creative")) tags.push("إبداعي");
  if (lower.includes("technical")) tags.push("تقني");
  if (lower.includes("professional")) tags.push("احترافي");
  if (lower.includes("beginner")) tags.push("مبتدئ");
  if (lower.includes("expert") || lower.includes("advanced")) tags.push("متقدم");
  return tags.slice(0, 3);
}
