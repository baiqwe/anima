import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { landingPageSlugs, getLandingPage, landingPages } from "@/config/landing-pages";
import { AnimeImageEditor } from "@/components/feature/anime-image-editor";
import { site } from "@/config/site";
import { locales } from "@/i18n/routing";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQSchema, HowToSchema } from "@/components/breadcrumb-schema";

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    landingPageSlugs.map((slug) => ({
      locale,
      slug,
    }))
  );
}

export async function generateMetadata(props: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { locale, slug } = params;

  const page = getLandingPage(slug);
  if (!page) return {};

  const isPrimaryAlias = page.slug === "photo-to-anime";
  const canonical = isPrimaryAlias ? `/${locale}` : `/${locale}/${page.slug}`;
  const ogImage = new URL(site.ogImagePath, site.siteUrl).toString();

  return {
    title: page.title,
    description: page.description,
    keywords: [page.targetKeyword, "photo to anime", "anime filter", "ai anime converter"],
    alternates: {
      canonical,
      languages: {
        en: `/en/${page.slug}`,
        zh: `/zh/${page.slug}`,
        "x-default": `/en/${page.slug}`,
      },
    },
    openGraph: {
      title: page.title,
      description: page.description,
      type: "website",
      url: new URL(canonical, site.siteUrl).toString(),
      siteName: site.siteName,
      images: [{ url: ogImage, width: 512, height: 512, alt: site.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [ogImage],
    },
    robots: isPrimaryAlias ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function LandingPage(props: { params: Promise<{ locale: string; slug: string }> }) {
  const params = await props.params;
  const { locale, slug } = params;

  const page = getLandingPage(slug);
  if (!page) notFound();

  const t = await getTranslations({ locale, namespace: "landing" });
  const localePrefix = `/${locale}`;
  const isPrimaryAlias = page.slug === "photo-to-anime";
  const relatedPages = Object.values(landingPages)
    .filter((item) => item.slug !== page.slug && item.slug !== "photo-to-anime")
    .slice(0, 3);
  const breadcrumbItems = [
    { name: locale === "zh" ? "首页" : "Home", href: `${localePrefix}` },
    { name: page.h1, href: isPrimaryAlias ? `${localePrefix}` : `${localePrefix}/${page.slug}` },
  ];
  const howToSteps = [
    { name: t("how_step1"), text: t("how_step1") },
    { name: t("how_step2"), text: t("how_step2") },
    { name: t("how_step3"), text: t("how_step3") },
  ];

  return (
    <div className="bg-background">
      <section className="py-10 lg:py-16 bg-gradient-to-b from-muted/20 to-background">
        <div className="container px-4 md:px-6">
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
          <FAQSchema items={page.faqs} />
          <HowToSchema name={page.h1} description={page.description} steps={howToSteps} />
          <AnimeImageEditor
            locale={locale}
            title={page.h1}
            subtitle={page.subtitle}
            defaultStyle={page.defaultStyle}
            hideStyleSelector={!!page.hideStyleSelector}
          />
        </div>
      </section>

      <section className="py-14 border-t bg-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">{t("how_title", { keyword: page.targetKeyword })}</h2>
              <ol className="grid gap-3 text-muted-foreground list-decimal pl-5">
                <li>{t("how_step1")}</li>
                <li>{t("how_step2")}</li>
                <li>{t("how_step3")}</li>
              </ol>
              <div className="rounded-xl border border-border bg-muted/20 p-6 text-sm leading-relaxed text-muted-foreground">
                <p>
                  {locale === "zh"
                    ? `${page.h1} 最适合清晰、光线良好的照片。正面或半侧面人像通常最稳定，复杂遮挡、模糊自拍或过暗背景更容易影响五官和发色还原。`
                    : `${page.h1} works best with sharp, well-lit photos. Front-facing or slight-angle portraits tend to preserve facial features better, while heavy occlusion, blur, or dark backgrounds can reduce consistency.`}
                </p>
                <p className="mt-3">
                  {locale === "zh"
                    ? "如果你在意头像可用性，建议先从较低浓度开始，再逐步提高风格强度；如果你想做更有表现力的视觉稿，可以尝试更高浓度和锁定风格页面。"
                    : "If you care about profile-picture accuracy, start with lower intensity and increase gradually. If you want a more stylized result, try a locked style page with higher intensity."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">{t("faq_title")}</h2>
              <div className="grid gap-6">
                {page.faqs.map((faq, idx) => (
                  <div key={idx} className="rounded-xl border border-border p-6 bg-muted/10">
                    <div className="text-lg font-bold">{faq.question}</div>
                    <div className="mt-2 text-muted-foreground leading-relaxed">{faq.answer}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                {locale === "zh" ? "相关动漫风格" : "Related Anime Styles"}
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {relatedPages.map((related) => (
                  <Link
                    key={related.slug}
                    href={`${localePrefix}/${related.slug}`}
                    className="rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary/40 hover:bg-muted/10"
                  >
                    <div className="text-lg font-semibold">{related.h1}</div>
                    <div className="mt-2 text-sm text-muted-foreground">{related.subtitle}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
