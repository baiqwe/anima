"use client";

import { Logo } from "./logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getLocalizedLandingPage } from "@/config/landing-pages";

export function Footer() {
  const pathname = usePathname();
  const t = useTranslations('footer');
  const isDashboard = /^\/(?:en|zh)?\/?dashboard(?:\/|$)/.test(pathname || "");

  // 检测当前 locale
  const pathParts = pathname?.split('/') || [];
  const currentLocale = (pathParts[1] === 'en' || pathParts[1] === 'zh') ? pathParts[1] : 'en';
  const localePrefix = `/${currentLocale}`;
  const isZh = currentLocale === "zh";

  const ghibliPage = getLocalizedLandingPage("ghibli-filter", currentLocale);
  const animePfpPage = getLocalizedLandingPage("anime-pfp-generator", currentLocale);
  const cyberpunkPage = getLocalizedLandingPage("cyberpunk-anime", currentLocale);
  const retroPage = getLocalizedLandingPage("90s-anime-filter", currentLocale);
  const webtoonPage = getLocalizedLandingPage("webtoon-ai", currentLocale);
  const cosplayPage = getLocalizedLandingPage("cosplay-enhancer", currentLocale);

  const toolLinks = [
    { label: isZh ? "照片转二次元" : "Photo to Anime", href: `${localePrefix}` },
    { label: ghibliPage?.h1 || (isZh ? "吉卜力风格滤镜" : "Ghibli Filter"), href: `${localePrefix}/ghibli-filter` },
    { label: animePfpPage?.h1 || (isZh ? "动漫头像生成器" : "Anime PFP Generator"), href: `${localePrefix}/anime-pfp-generator` },
    { label: cyberpunkPage?.h1 || (isZh ? "赛博朋克动漫滤镜" : "Cyberpunk Anime Filter"), href: `${localePrefix}/cyberpunk-anime` },
  ];

  const styleLinks = [
    { label: retroPage?.h1 || (isZh ? "90 年代复古动漫滤镜" : "90s Anime Filter"), href: `${localePrefix}/90s-anime-filter` },
    { label: webtoonPage?.h1 || (isZh ? "韩漫风 AI 滤镜" : "Webtoon AI Filter"), href: `${localePrefix}/webtoon-ai` },
    { label: cosplayPage?.h1 || (isZh ? "Cos 照增强器" : "Cosplay Enhancer"), href: `${localePrefix}/cosplay-enhancer` },
  ];

  const legalLinks = [
    { label: t('link_privacy'), href: `${localePrefix}/privacy` },
    { label: t('link_terms'), href: `${localePrefix}/terms` },
    { label: t('link_about'), href: `${localePrefix}/about` },
    { label: t('link_contact'), href: `${localePrefix}/contact` },
  ];

  if (isDashboard) {
    return (
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by{" "}
              <span className="font-medium">Bai</span>
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.86))]">
      <div className="container px-4 py-14 md:py-20">
        <div className="surface-panel px-6 py-8 md:px-8 md:py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-full lg:col-span-2">
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              {t('tagline')}
            </p>
            <p className="mt-3 inline-flex rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
              {currentLocale === 'zh'
                ? '提示：为生成效果，上传图片会发送到第三方 AI 服务处理。'
                : 'Note: uploads are sent to a third-party AI service for generation.'}
            </p>
          </div>

          {/* Tools - 工具内链 */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">
              {currentLocale === 'zh' ? '转换工具' : 'Tools'}
            </h3>
            <nav className="flex flex-col gap-2">
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-all hover:translate-x-0.5 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Styles */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">
              {currentLocale === 'zh' ? '热门风格' : 'Styles'}
            </h3>
            <nav className="flex flex-col gap-2">
              {styleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-all hover:translate-x-0.5 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{t('legal')}</h3>
            <nav className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-all hover:translate-x-0.5 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} {t('brand')}. {t('rights')}
          </p>
          <p className="text-center text-sm text-muted-foreground md:text-right">
            {t('built_by')}
          </p>
        </div>
        </div>
      </div>
    </footer>
  );
}
