import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { site } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, MessageCircleHeart } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { buildLocaleAlternates } from "@/utils/seo/metadata";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  const title = t("meta_title");
  const description = t("meta_desc");
  const ogImage = new URL(site.ogImagePath, site.siteUrl).toString();

  return {
    title,
    description,
    alternates: buildLocaleAlternates(`/${locale}/contact`),
    openGraph: {
      title,
      description,
      type: "website",
      url: new URL(`/${locale}/contact`, site.siteUrl).toString(),
      siteName: site.siteName,
      images: [{ url: ogImage, width: 512, height: 512, alt: site.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ContactPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const { locale } = params;
  const localePrefix = `/${locale}`;
  const t = await getTranslations({ locale, namespace: "Contact" });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-4 md:px-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={localePrefix}>
              <ArrowLeft className="h-4 w-4" />
              {t("home")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="container px-4 py-16 md:px-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <Breadcrumbs
            items={[
              { name: t("home"), href: localePrefix },
              { name: t("title"), href: `${localePrefix}/contact` },
            ]}
          />

          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
            <p className="mx-auto max-w-3xl text-muted-foreground">{t("p1")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {t("support_title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>{t("support_desc")}</p>
              <a href={`mailto:${site.supportEmail}`} className="text-lg font-semibold text-primary hover:underline">
                {site.supportEmail}
              </a>
              <p>{t("p2")}</p>
            </CardContent>
          </Card>

          <div className="rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-3">
              <MessageCircleHeart className="mt-0.5 h-5 w-5 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">{t("p3")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
