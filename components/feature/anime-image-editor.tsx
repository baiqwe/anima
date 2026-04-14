"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import ImageUploader from "@/components/feature/image-uploader";
import { QuickRefillModal } from "@/components/payment/quick-refill-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2, RefreshCw, Wand2 } from "lucide-react";
import type { AnimeStyleId } from "@/config/landing-pages";
import { useCredits } from "@/hooks/use-credits";
import { useUser } from "@/hooks/use-user";

type Intensity = "low" | "medium" | "high";

type AnimeImageEditorProps = {
  locale: string;
  user?: any;
  title: string;
  subtitle?: string;
  defaultStyle: AnimeStyleId;
  hideStyleSelector?: boolean;
  compact?: boolean;
  onImageUploaded?: (uploaded: boolean, imageSrc?: string) => void;
  emptyAside?: ReactNode;
};

const STYLE_OPTIONS: Array<{ id: AnimeStyleId; label: string; desc: string }> = [
  { id: "standard", label: "Standard Anime", desc: "Clean 2D anime portrait look." },
  { id: "ghibli", label: "Ghibli-Inspired", desc: "Warm, hand-drawn storybook feel." },
  { id: "cyberpunk", label: "Cyberpunk Anime", desc: "Neon lights, futuristic mood." },
  { id: "retro_90s", label: "90s Retro Anime", desc: "Cel shading + nostalgic palette." },
  { id: "webtoon", label: "Webtoon", desc: "Crisp lines, modern comic shading." },
  { id: "cosplay", label: "Cosplay Enhancer", desc: "Polished anime redraw for cosplay shots." },
];

function sliderValueToIntensity(value: number): Intensity {
  if (value <= 20) return "low";
  if (value <= 80) return "medium";
  return "high";
}

async function convertHeic(file: File): Promise<string> {
  const heic2any = (await import("heic2any")).default;
  const convertedBlob = await heic2any({ blob: file, toType: "image/png" });
  const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to convert HEIC image"));
    reader.readAsDataURL(blob);
  });
}

export function AnimeImageEditor({
  locale,
  user: initialUser,
  title,
  subtitle,
  defaultStyle,
  hideStyleSelector = false,
  compact = false,
  onImageUploaded,
  emptyAside,
}: AnimeImageEditorProps) {
  const t = useTranslations("anime_editor");
  const { user: hookUser } = useUser();
  const { credits, refetchCredits } = useCredits();
  const user = initialUser ?? hookUser;
  const pathname = usePathname();

  const [originalImage, setOriginalImage] = useState("");
  const [fileName, setFileName] = useState("image");

  const [style, setStyle] = useState<AnimeStyleId>(defaultStyle);
  const [intensityValue, setIntensityValue] = useState(50);
  const [keepEyeColor, setKeepEyeColor] = useState(true);
  const [keepHairColor, setKeepHairColor] = useState(true);
  const [extraPrompt, setExtraPrompt] = useState("");

  const [resultImage, setResultImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuickRefillOpen, setIsQuickRefillOpen] = useState(false);

  useEffect(() => {
    setStyle(defaultStyle);
  }, [defaultStyle]);

  const localePrefix = useMemo(() => `/${locale}`, [locale]);
  const intensity = useMemo(() => sliderValueToIntensity(intensityValue), [intensityValue]);
  const selectedStyle = useMemo(() => STYLE_OPTIONS.find((s) => s.id === style), [style]);

  const handleImageSelect = (imageSrc: string, file: File) => {
    setOriginalImage(imageSrc);
    setFileName(file.name.replace(/\.[^/.]+$/, "") || "image");
    setResultImage("");
    setError(null);
    onImageUploaded?.(true, imageSrc);
  };

  const handleReset = () => {
    setOriginalImage("");
    setResultImage("");
    setError(null);
    onImageUploaded?.(false, undefined);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `${fileName}_anime.png`;
    link.click();
  };

  const executeGenerate = async (targetStyle: AnimeStyleId = style) => {
    if (!originalImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          image: originalImage,
          style: targetStyle,
          intensity,
          keepEyeColor,
          keepHairColor,
          prompt: extraPrompt,
        }),
      });

      if (response.status === 401) {
        setError(t("error_signin_required"));
        return;
      }

      const rawResponse = await response.text();
      let data: any = null;

      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch {
          data = { error: rawResponse };
        }
      }

      if (response.status === 402 && data?.code === "INSUFFICIENT_CREDITS") {
        setIsQuickRefillOpen(true);
        return;
      }

      if (!response.ok) {
        const fallbackMessage =
          typeof data?.error === "string" && data.error.trim()
            ? data.error
            : rawResponse?.trim() || t("error_failed");
        throw new Error(fallbackMessage);
      }

      if (!data?.url) {
        throw new Error(typeof data?.error === "string" ? data.error : t("error_failed"));
      }

      setResultImage(data.url);
      void refetchCredits();
    } catch (e: any) {
      setError(e instanceof Error ? e.message : t("error_failed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    void executeGenerate(style);
  };

  if (!originalImage) {
    const uploadCard = (
        <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h2>
          {subtitle ? <p className="mx-auto max-w-2xl text-lg leading-8 text-foreground/72">{subtitle}</p> : null}
        </div>
        <Card className="surface-panel p-6 md:p-8">
          <ImageUploader
            onImageSelect={handleImageSelect}
            onHeicConvert={convertHeic}
            onDemoPresetSelect={setStyle}
          />
        </Card>
      </div>
    );

    return (
      <div className={compact ? "w-full" : "max-w-5xl mx-auto"}>
        {emptyAside ? (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            {uploadCard}
            {emptyAside}
          </div>
        ) : (
          uploadCard
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "w-full" : "max-w-6xl mx-auto"}>
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="surface-panel space-y-6 p-6 lg:sticky lg:top-24">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t("panel_title")}</h2>
            <p className="text-sm text-foreground/68">{t("panel_subtitle")}</p>
          </div>

          {!hideStyleSelector && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t("style_label")}</Label>
              <RadioGroup value={style} onValueChange={(v) => setStyle(v as AnimeStyleId)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STYLE_OPTIONS.map((s) => (
                    <label
                      key={s.id}
                      htmlFor={`style-${s.id}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-[24px] p-4 transition-all duration-300 ${
                        style === s.id
                          ? "border-primary/[0.35] bg-[linear-gradient(135deg,rgba(255,102,147,0.12),rgba(94,210,198,0.08))] shadow-[0_22px_40px_-30px_hsl(var(--primary))]"
                          : "border-border/80 bg-background/[0.94] hover:border-primary/[0.15] hover:bg-muted/[0.34] hover:shadow-[0_16px_32px_-26px_rgba(27,31,45,0.18)]"
                      }`}
                    >
                      <RadioGroupItem value={s.id} id={`style-${s.id}`} className="mt-1" />
                      <div className="space-y-1">
                        <div className="font-semibold">{s.label}</div>
                        <div className="text-sm text-foreground/68">{s.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
              {selectedStyle ? (
                <p className="text-xs text-foreground/62">
                  {t("style_hint")}: <span className="font-medium text-foreground">{selectedStyle.label}</span>
                </p>
              ) : null}
            </div>
          )}

          <div className="space-y-3 rounded-[24px] border border-border/75 bg-muted/[0.42] p-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t("intensity_label")}</Label>
              <span className="text-sm text-foreground/68">{t(`intensity_${intensity}`)}</span>
            </div>
            <Slider
              value={[intensityValue]}
              onValueChange={(value) => {
                const nextValue = value[0];
                if (typeof nextValue === "number") {
                  setIntensityValue(nextValue);
                }
              }}
              min={0}
              max={100}
              step={1}
              aria-label={t("intensity_label")}
            />
            <div className="flex justify-between text-xs text-foreground/62">
              <span>{t("intensity_low")}</span>
              <span>{t("intensity_high")}</span>
            </div>
          </div>

          <div className="space-y-3 rounded-[24px] border border-border/75 bg-muted/[0.42] p-4">
            <Label className="text-base font-semibold">{t("details_label")}</Label>
            <div className="grid gap-3">
              <label className="flex items-center gap-3">
                <Checkbox checked={keepEyeColor} onCheckedChange={(v) => setKeepEyeColor(!!v)} />
                <span className="text-sm">{t("keep_eye_color")}</span>
              </label>
              <label className="flex items-center gap-3">
                <Checkbox checked={keepHairColor} onCheckedChange={(v) => setKeepHairColor(!!v)} />
                <span className="text-sm">{t("keep_hair_color")}</span>
              </label>
            </div>
          </div>

          <div className="space-y-3 rounded-[24px] border border-border/75 bg-muted/[0.34] p-4">
            <Label className="text-base font-semibold">{t("prompt_label")}</Label>
            <textarea
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder={t("prompt_placeholder")}
              className="min-h-[100px] w-full rounded-[22px] border border-border/80 bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {!user ? (
            <div className="rounded-[24px] border border-primary/20 bg-primary/[0.06] p-4 space-y-3">
              <p className="text-sm text-foreground">{t("signin_gate_title")}</p>
              <p className="text-sm text-foreground/68">{t("signin_gate_desc")}</p>
              <div className="flex gap-3">
                <Button asChild className="flex-1 rounded-full shadow-[0_18px_30px_-18px_hsl(var(--primary))]">
                  <Link href={`${localePrefix}/sign-up`}>{t("cta_signup")}</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 rounded-full">
                  <Link href={`${localePrefix}/sign-in`}>{t("cta_signin")}</Link>
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <div className="flex-1">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !originalImage}
                className="w-full rounded-full shadow-[0_18px_30px_-18px_hsl(var(--primary))] data-[loading=true]:animate-pulse"
                size="lg"
                data-loading={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {t("generate")}
                  </>
                )}
              </Button>
              {user && typeof credits?.remaining_credits === "number" ? (
                <p
                  className={`mt-2 text-center text-xs ${
                    credits.remaining_credits <= 1 ? "text-amber-600" : "text-foreground/60"
                  }`}
                >
                  {credits.remaining_credits <= 1
                    ? t("credits_last_chance")
                    : t("credits_remaining", { count: credits.remaining_credits })}
                </p>
              ) : null}
            </div>
            <Button onClick={handleReset} variant="outline" size="lg" className="rounded-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("reset")}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleDownload} disabled={!resultImage} variant="secondary" className="flex-1 rounded-full">
              <Download className="w-4 h-4 mr-2" />
              {t("download")}
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-card overflow-hidden">
              <div className="border-b border-border/80 bg-[linear-gradient(180deg,rgba(227,104,74,0.05),rgba(255,255,255,0.2))] px-4 py-3 text-sm font-medium">
                {t("preview_before")}
              </div>
              <div className="aspect-[4/5] bg-muted/10">
                <img src={originalImage} alt={t("preview_before")} className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="surface-card overflow-hidden">
              <div className="border-b border-border/80 bg-[linear-gradient(180deg,rgba(27,163,147,0.06),rgba(255,255,255,0.2))] px-4 py-3 text-sm font-medium">
                {resultImage ? t("preview_after") : (locale === "zh" ? "风格结果预览区" : "Generated result preview")}
              </div>
              <div className="relative aspect-[4/5] bg-muted/10">
                {isGenerating ? (
                  <div className="absolute inset-0 overflow-hidden bg-background/[0.82] backdrop-blur-sm">
                    <div className="absolute inset-y-0 left-[-35%] w-1/3 skew-x-[-18deg] bg-white/35 blur-2xl animate-[shimmer_1.8s_ease-in-out_infinite]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,102,147,0.12),transparent_45%)] animate-pulse" />
                    <div className="relative flex h-full items-center justify-center">
                    <div className="text-center space-y-3">
                      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                      <div className="text-sm text-foreground/72">{t("processing")}</div>
                    </div>
                    </div>
                  </div>
                ) : null}

                {resultImage ? (
                  <img src={resultImage} alt={t("preview_after")} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-sm leading-7 text-foreground/68">
                    {locale === "zh"
                      ? "生成完成后，这里会显示最终动漫结果。你可以继续换风格、调浓度，直到挑到最喜欢的版本。"
                      : "Your final anime result will appear here after generation. You can keep switching styles and intensity until you land on the version you like most."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {resultImage && !isGenerating && !error ? (
            <div className="rounded-[24px] border border-primary/15 bg-primary/[0.03] p-5 text-center">
              <p className="mb-3 text-sm font-semibold text-foreground/80">
                {t("try_other_styles")}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {STYLE_OPTIONS.filter((option) => option.id !== style)
                  .slice(0, 3)
                  .map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-background hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
                      onClick={() => {
                        setStyle(option.id);
                        void executeGenerate(option.id);
                      }}
                    >
                      <Wand2 className="mr-1.5 h-3 w-3 text-primary opacity-80" />
                      {option.label}
                    </Button>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="text-center text-xs text-foreground/60">
            {t("disclaimer")}
          </div>
        </div>
      </div>
      <QuickRefillModal
        isOpen={isQuickRefillOpen}
        onClose={() => setIsQuickRefillOpen(false)}
        currentPath={pathname}
      />
    </div>
  );
}
