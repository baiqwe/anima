"use client";

import { Logo } from "./logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { landingPages } from "@/config/landing-pages";

export function Footer() {
  const pathname = usePathname();
  const t = useTranslations('footer');
  const isDashboard = pathname?.startsWith("/dashboard");

  // 检测当前 locale
  const pathParts = pathname?.split('/') || [];
  const currentLocale = (pathParts[1] === 'en' || pathParts[1] === 'zh') ? pathParts[1] : 'en';
  const localePrefix = `/${currentLocale}`;

  const toolLinks = [
    { label: "Photo to Anime", labelZh: "照片转二次元", href: `${localePrefix}` },
    { label: landingPages["ghibli-filter"]?.h1 || "Ghibli Filter", labelZh: "吉卜力风格", href: `${localePrefix}/ghibli-filter` },
    { label: landingPages["anime-pfp-generator"]?.h1 || "Anime PFP", labelZh: "动漫头像", href: `${localePrefix}/anime-pfp-generator` },
    { label: landingPages["cyberpunk-anime"]?.h1 || "Cyberpunk Anime", labelZh: "赛博朋克", href: `${localePrefix}/cyberpunk-anime` },
  ];

  const styleLinks = [
    { label: landingPages["90s-anime-filter"]?.h1 || "90s Anime", href: `${localePrefix}/90s-anime-filter` },
    { label: landingPages["webtoon-ai"]?.h1 || "Webtoon", href: `${localePrefix}/webtoon-ai` },
    { label: landingPages["cosplay-enhancer"]?.h1 || "Cosplay Enhancer", href: `${localePrefix}/cosplay-enhancer` },
  ];

  const legalLinks = [
    { label: t('link_privacy'), href: `${localePrefix}/privacy` },
    { label: t('link_terms'), href: `${localePrefix}/terms` },
    { label: t('link_about'), href: `${localePrefix}/about` },
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
    <footer className="border-t bg-muted/30">
      <div className="container px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-full lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              {t('tagline')}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
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
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {currentLocale === 'zh' ? link.labelZh : link.label}
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
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
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
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} {t('brand')}. {t('rights')}
          </p>
          <p className="text-center text-sm text-muted-foreground md:text-right">
            {t('built_by')}
          </p>
        </div>
      </div>
    </footer>
  );
}
