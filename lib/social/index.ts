import type { SocialPlatform, SocialProvider } from "./types";
import { twitterProvider } from "./providers/twitter";
import { telegramProvider } from "./providers/telegram";
import { facebookProvider } from "./providers/facebook";
import { instagramProvider } from "./providers/instagram";
import { tiktokProvider } from "./providers/tiktok";

const providers: Record<SocialPlatform, SocialProvider> = {
  twitter: twitterProvider,
  telegram: telegramProvider,
  facebook: facebookProvider,
  instagram: instagramProvider,
  tiktok: tiktokProvider,
};

export function getProvider(platform: SocialPlatform): SocialProvider {
  return providers[platform];
}

export * from "./types";
