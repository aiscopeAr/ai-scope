/**
 * lib/knowledge-graph/builders/relational.ts
 *
 * Edges derived directly from real foreign-key relations already in the
 * schema — the most reliable class of edge, since there is zero inference
 * involved: the DB row itself IS the relationship.
 */
import type { Edge, Entity } from "../types";

export interface ToolRef { id: string; slug: string; name: string; }
export interface ComparisonRef { id: string; slug: string; title: string; }
export interface PromptRef { id: string; slug: string; titleAr: string; }

function toolEntity(t: ToolRef): Entity { return { kind: "tool", id: t.id, slug: t.slug, title: t.name }; }
function comparisonEntity(c: ComparisonRef): Entity { return { kind: "comparison", id: c.id, slug: c.slug, title: c.title }; }
function promptEntity(p: PromptRef): Entity { return { kind: "prompt", id: p.id, slug: p.slug, title: p.titleAr }; }

/** Tool ↔ Comparison, from ComparisonSide.toolId — one edge per side. */
export function buildToolComparisonEdges(
  comparisons: { comparison: ComparisonRef; sides: { tool: ToolRef }[] }[],
): Edge[] {
  const edges: Edge[] = [];
  for (const { comparison, sides } of comparisons) {
    for (const side of sides) {
      edges.push({
        relation: "tool-comparison",
        from: toolEntity(side.tool),
        to: comparisonEntity(comparison),
        source: "ComparisonSide.toolId",
        explanation: `${side.tool.name} is one of the compared tools in "${comparison.title}".`,
      });
    }
  }
  return edges;
}

/** Tool ↔ Prompt, from Prompt.toolId — a prompt with no linked tool is a
 *  genuine skip (Sprint 2's audit confirmed most "general" prompts are
 *  intentionally tool-agnostic, not missing data). */
export function buildToolPromptEdges(prompts: { prompt: PromptRef; tool: ToolRef | null }[]): Edge[] {
  const edges: Edge[] = [];
  for (const { prompt, tool } of prompts) {
    if (!tool) continue;
    edges.push({
      relation: "tool-prompt",
      from: toolEntity(tool),
      to: promptEntity(prompt),
      source: "Prompt.toolId",
      explanation: `"${prompt.titleAr}" is a ready-made prompt for ${tool.name}.`,
    });
  }
  return edges;
}
