import { site } from "@/config/site";

function toAbsoluteUrl(pathname: string) {
  try {
    return new URL(pathname, site.siteUrl).toString();
  } catch {
    return site.siteUrl;
  }
}

export function buildLocaleAlternates(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const enPath = normalizedPath.replace(/^\/(en|zh)(?=\/|$)/, "/en");
  const zhPath = normalizedPath.replace(/^\/(en|zh)(?=\/|$)/, "/zh");

  return {
    canonical: toAbsoluteUrl(normalizedPath),
    languages: {
      "en-US": toAbsoluteUrl(enPath),
      "zh-CN": toAbsoluteUrl(zhPath),
      "x-default": toAbsoluteUrl(enPath),
    },
  };
}
