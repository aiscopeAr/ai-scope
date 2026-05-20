// AI topic classifier — keyword-based fast filter (zero cost, runs before OpenAI call)

const AI_KEYWORDS_EN = [
  "artificial intelligence", "machine learning", "deep learning", "neural network",
  "large language model", "llm", "gpt", "chatgpt", "openai", "anthropic", "gemini",
  "claude", "mistral", "llama", "cohere", "hugging face", "huggingface",
  "ai model", "ai tool", "ai startup", "ai research", "ai company", "ai chip",
  "generative ai", "gen ai", "genai", "foundation model", "transformer model",
  "computer vision", "natural language processing", "nlp",
  "reinforcement learning", "supervised learning", "unsupervised learning",
  "diffusion model", "stable diffusion", "midjourney", "dall-e", "sora",
  "nvidia", "a100", "h100", "gpu cluster", "tpu",
  "robotics", "autonomous vehicle", "self-driving", "automation",
  "copilot", "ai assistant", "ai agent", "multimodal", "embedding",
  "vector database", "rag", "retrieval augmented",
  "ai safety", "ai alignment", "ai ethics", "ai regulation", "ai policy",
  "ai governance", "ai bias", "responsible ai",
  "tensorflow", "pytorch", "keras", "langchain",
  "ai inference", "ai training", "fine-tuning", "finetuning",
  "image generation", "text generation", "speech recognition", "voice ai",
  "chatbot", "virtual assistant", "recommendation system",
  "ai benchmark", "ai evaluation", "ai deployment",
  "openai api", "anthropic api", "google ai", "microsoft ai", "meta ai",
  "deepmind", "google deepmind", "xai", "grok", "perplexity",
  "ai funding", "ai valuation", "ai acquisition",
];

const AI_KEYWORDS_AR = [
  "الذكاء الاصطناعي", "تعلم الآلة", "التعلم العميق", "الشبكات العصبية",
  "نموذج لغوي", "نماذج اللغة", "الذكاء", "روبوت", "روبوتات",
  "توليدي", "نموذج الذكاء", "أدوات الذكاء", "شركات الذكاء",
  "التعلم الآلي", "الأتمتة", "المساعد الذكي", "الدردشة الذكية",
  "البيانات الضخمة", "تحليل البيانات", "رؤية الحاسوب",
  "معالجة اللغة", "التوليد التلقائي", "الترجمة الآلية",
  "نيفيديا", "أوبن إيه آي", "جوجل ديب مايند", "مايكروسوفت ذكاء",
];

export function isAiRelated(title: string, content: string): boolean {
  const combined = `${title} ${content.slice(0, 2000)}`.toLowerCase();
  return (
    AI_KEYWORDS_EN.some((kw) => combined.includes(kw)) ||
    AI_KEYWORDS_AR.some((kw) => `${title} ${content.slice(0, 2000)}`.includes(kw))
  );
}
