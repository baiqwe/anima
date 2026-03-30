export type SiteConfig = {
  siteName: string;
  siteUrl: string;
  ogImagePath: string;
  supportEmail: string;
};

function normalizeSiteUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const site: SiteConfig = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Photo to Anime AI",
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  ogImagePath: process.env.NEXT_PUBLIC_OG_IMAGE_PATH || "/web-app-manifest-512x512.png",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
};
