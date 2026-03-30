import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Sparkles, Shield, Zap, Users, ArrowRight, Palette, Camera } from "lucide-react";
import { landingPages } from "@/config/landing-pages";
import type { ReactNode } from "react";

type Props = { locale: string };

export default async function HomeStaticContent({ locale }: Props) {
  const isZh = locale === "zh";
  const t = await getTranslations({ locale, namespace: "home_static" });
  const localePrefix = `/${locale}`;

  const featured = [
    landingPages["ghibli-filter"],
    landingPages["anime-pfp-generator"],
    landingPages["90s-anime-filter"],
    landingPages["cyberpunk-anime"],
    landingPages["webtoon-ai"],
    landingPages["cosplay-enhancer"],
  ].filter(Boolean);

  return (
    <>
      <section className="py-16 bg-background border-t">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Sparkles className="w-6 h-6 text-primary" />}
                title={t("f1_title")}
                desc={t("f1_desc")}
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6 text-primary" />}
                title={t("f2_title")}
                desc={t("f2_desc")}
              />
              <FeatureCard
                icon={<Shield className="w-6 h-6 text-primary" />}
                title={t("f3_title")}
                desc={t("f3_desc")}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("styles_title")}</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t("styles_subtitle")}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (
                <Link
                  key={p.slug}
                  href={`${localePrefix}/${p.slug}`}
                  className="group bg-background rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-xl font-bold">{p.h1}</div>
                      <div className="text-sm text-muted-foreground">{p.subtitle}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href={`${localePrefix}`}
                className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
              >
                {t("styles_more")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("use_title")}</h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t("use_subtitle")}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Users className="w-6 h-6 text-primary" />}
                title={t("u1_title")}
                desc={t("u1_desc")}
              />
              <FeatureCard
                icon={<Camera className="w-6 h-6 text-primary" />}
                title={t("u2_title")}
                desc={t("u2_desc")}
              />
              <FeatureCard
                icon={<Palette className="w-6 h-6 text-primary" />}
                title={t("u3_title")}
                desc={t("u3_desc")}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/20 border-t">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("faq_title")}</h2>
              <p className="text-muted-foreground text-lg">{t("faq_subtitle")}</p>
            </div>

            <div className="grid gap-6">
              {[
                { q: t("faq1_q"), a: t("faq1_a") },
                { q: t("faq2_q"), a: t("faq2_a") },
                { q: t("faq3_q"), a: t("faq3_a") },
                { q: t("faq4_q"), a: t("faq4_a") },
              ].map((item, idx) => (
                <div key={idx} className="bg-background rounded-xl border border-border p-6 space-y-2">
                  <div className="text-lg font-bold">{item.q}</div>
                  <div className="text-muted-foreground leading-relaxed">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-muted/20 to-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("cta_title")}</h2>
            <p className="text-muted-foreground text-lg">{t("cta_subtitle")}</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href={`${localePrefix}/sign-up`}
                className="px-8 py-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                {t("cta_signup")}
              </Link>
              <Link
                href={`${localePrefix}/pricing`}
                className="px-8 py-4 rounded-full bg-background border border-border hover:bg-muted/30 transition-colors font-medium"
              >
                {t("cta_pricing")}
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">{isZh ? "效果取决于图片质量与风格选择。" : "Results vary by photo quality and chosen style."}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-background rounded-xl p-6 border border-border">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">{icon}</div>
      <div className="text-xl font-bold mb-2">{title}</div>
      <div className="text-muted-foreground">{desc}</div>
    </div>
  );
}
