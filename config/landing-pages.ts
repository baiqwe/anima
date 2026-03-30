import rawLandingPages from "./landing-pages.json";

export type AnimeStyleId = "standard" | "ghibli" | "cyberpunk" | "retro_90s" | "webtoon" | "cosplay";

export type LandingPageFaq = { question: string; answer: string };

export type LandingPageConfig = {
  slug: string;
  targetKeyword: string;
  title: string;
  description: string;
  h1: string;
  subtitle: string;
  defaultStyle: AnimeStyleId;
  hideStyleSelector?: boolean;
  faqs: LandingPageFaq[];
};

export const landingPages = rawLandingPages as Record<string, LandingPageConfig>;

export function getLandingPage(slug: string): LandingPageConfig | null {
  return landingPages[slug] || null;
}

export const landingPageSlugs = Object.keys(landingPages);
export const indexableLandingPageSlugs = landingPageSlugs.filter((slug) => slug !== "photo-to-anime");
