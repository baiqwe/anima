import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

export default async function HomeHeroContent({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "hero" });

  return (
    <div className="text-center space-y-5">
      <div className="section-kicker">{t("badge")}</div>
      <h1 className="mx-auto max-w-5xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        {t("title")}{" "}
        <span className="bg-gradient-to-r from-primary via-[#c66044] to-[#1ba393] bg-clip-text text-transparent">
          {t("title_highlight")}
        </span>
      </h1>
      <p className="mx-auto max-w-3xl text-lg leading-8 text-foreground/72 md:text-xl">
        {t("subtitle")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-sm text-foreground/72">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/[0.94] px-4 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#1c9f6b]"></span>
          {t("feature_1")}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/[0.94] px-4 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#1ba393]"></span>
          {t("feature_2")}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/[0.94] px-4 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-primary"></span>
          {t("feature_3")}
        </div>
      </div>
    </div>
  );
}
