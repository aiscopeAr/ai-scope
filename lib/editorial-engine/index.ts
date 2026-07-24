/**
 * lib/editorial-engine/index.ts
 * Public entry point for the Editorial Validation Engine.
 */
export * from "./types";
export * from "./core";
export * from "./scoring";
export * from "./policy";
export { DEFAULT_RULES } from "./rules/index";

export { toEditorialSubject as reviewToSubject } from "./adapters/review";
export { toEditorialSubject as comparisonToSubject } from "./adapters/comparison";
export { toEditorialSubject as aiToolToSubject } from "./adapters/aiTool";
export { toEditorialSubject as promptToSubject } from "./adapters/prompt";
