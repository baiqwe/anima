"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
    PLAN_ANCHOR,
    PLAN_MINI,
    PLAN_PRO_MONTHLY,
    PLAN_PRO_YEARLY,
    PricingPlan,
    calculateCostPerGeneration,
    getLocalizedPlan,
} from "@/config/credit-packs";

interface PricingSectionProps {
    locale: string;
}

type LocalizedPlan = PricingPlan & {
    displayName: string;
    displayLabel?: string;
    displayDescription?: string;
    displayBadge?: string;
};

export function PricingSection({ locale }: PricingSectionProps) {
    const t = useTranslations("Pricing");
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

    const plans = [
        getLocalizedPlan(PLAN_MINI, locale) as LocalizedPlan,
        getLocalizedPlan(PLAN_ANCHOR, locale) as LocalizedPlan,
        getLocalizedPlan(PLAN_PRO_MONTHLY, locale) as LocalizedPlan,
        getLocalizedPlan(PLAN_PRO_YEARLY, locale) as LocalizedPlan,
    ];

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(price);

    const handlePurchase = async (plan: PricingPlan) => {
        try {
            setLoadingPlanId(plan.id);

            const formData = new FormData();
            formData.append("priceId", plan.productId);
            formData.append("productType", plan.type === "subscription" ? "subscription" : "credits");

            if (plan.credits) {
                formData.append("credits", plan.credits.toString());
            }

            const successUrl = new URL(window.location.href);
            successUrl.pathname = `/${locale}/dashboard`;
            successUrl.searchParams.set("checkout", "success");
            formData.append("redirectUrl", successUrl.toString());

            const response = await fetch("/api/creem/checkout", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Checkout failed");
            }

            if (data.checkout_url) {
                window.location.href = data.checkout_url;
                return;
            }

            toast({
                title: t("error"),
                description: t("checkout_failed"),
                variant: "destructive",
            });
        } catch (error) {
            console.error("Payment error:", error);
            toast({
                title: t("error"),
                description: t("checkout_failed"),
                variant: "destructive",
            });
        } finally {
            setLoadingPlanId(null);
        }
    };

    const renderFeatures = (items: string[], options?: { dimmed?: boolean; yearly?: boolean }) => (
        <ul className="space-y-3">
            {items.map((item) => (
                <li
                    key={item}
                    className={cn(
                        "flex items-start gap-2 text-sm",
                        options?.dimmed
                            ? options?.yearly
                                ? "text-slate-400 line-through"
                                : "text-muted-foreground line-through"
                            : options?.yearly
                                ? "text-slate-100"
                                : "text-foreground/90"
                    )}
                >
                    <Check
                        className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            options?.dimmed
                                ? options?.yearly
                                    ? "text-slate-500"
                                    : "text-muted-foreground/70"
                                : options?.yearly
                                    ? "text-emerald-300"
                                    : "text-primary"
                        )}
                    />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );

    const renderCard = (plan: LocalizedPlan) => {
        const isStarter = plan.id === PLAN_MINI.id;
        const isPack = plan.id === PLAN_ANCHOR.id;
        const isMonthly = plan.id === PLAN_PRO_MONTHLY.id;
        const isYearly = plan.id === PLAN_PRO_YEARLY.id;
        const costPerImage = calculateCostPerGeneration(plan);

        const cardClass = isYearly
            ? "border-slate-800 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_30%),linear-gradient(180deg,#111827_0%,#020617_100%)] text-white shadow-[0_35px_120px_-35px_rgba(15,23,42,0.9)]"
            : isMonthly
                ? "border-primary/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,245,255,0.95))] shadow-[0_30px_110px_-40px_rgba(147,51,234,0.55)]"
                : "border-border/70 bg-white/95 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.3)]";

        const badgeClass = isYearly
            ? "bg-amber-300 text-slate-950"
            : isMonthly
                ? "bg-rose-500 text-white"
                : "bg-muted text-foreground";

        const buttonClass = isYearly
            ? "bg-white text-slate-950 hover:bg-slate-100"
            : isMonthly
                ? "group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border bg-background text-foreground hover:bg-muted";

        const textMuted = isYearly ? "text-slate-300" : "text-muted-foreground";
        const divider = isYearly ? "border-white/10" : "border-border/60";
        const anchorClass = isYearly ? "text-emerald-300" : isMonthly ? "text-primary" : "text-foreground";

        const coreFeatures = isStarter
            ? [
                t("cards.starter.features.credits"),
                t("cards.starter.features.speed"),
                t("cards.starter.features.resolution"),
            ]
            : isPack
                ? [
                    t("cards.pro_pack.features.credits"),
                    t("cards.pro_pack.features.speed"),
                    t("cards.pro_pack.features.resolution"),
                    t("cards.pro_pack.features.watermark"),
                ]
                : isMonthly
                    ? [
                        t("cards.monthly.features.credits"),
                        t("cards.monthly.features.queue"),
                        t("cards.monthly.features.upscale"),
                        t("cards.monthly.features.styles"),
                        t("cards.monthly.features.license"),
                        t("cards.monthly.features.watermark"),
                    ]
                    : [
                        t("cards.yearly.features.credits"),
                        t("cards.yearly.features.queue"),
                        t("cards.yearly.features.upscale"),
                        t("cards.yearly.features.styles"),
                        t("cards.yearly.features.license"),
                        t("cards.yearly.features.watermark"),
                    ];

        const missingFeatures = isStarter
            ? [
                t("cards.starter.missing.queue"),
                t("cards.starter.missing.upscale"),
                t("cards.starter.missing.license"),
            ]
            : isPack
                ? [
                    t("cards.pro_pack.missing.queue"),
                    t("cards.pro_pack.missing.upscale"),
                    t("cards.pro_pack.missing.styles"),
                ]
                : [];

        return (
            <div
                key={plan.id}
                className={cn(
                    "relative flex h-full snap-center flex-col rounded-[32px] border px-7 pb-6 pt-7 transition-all duration-300 hover:-translate-y-1",
                    cardClass,
                    isMonthly || isYearly ? "lg:z-10" : ""
                )}
            >
                {plan.displayLabel ? (
                    <div className="absolute inset-x-0 -top-4 z-20 flex justify-center px-3">
                        <span className={cn("rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] shadow-lg", badgeClass)}>
                            {plan.displayLabel}
                            {plan.displayBadge ? ` · ${plan.displayBadge}` : ""}
                        </span>
                    </div>
                ) : null}

                <div className={cn("relative z-10 flex flex-col gap-3.5", plan.displayLabel ? "pt-6" : "pt-0")}>
                    <div>
                        <p className={cn("text-xs font-semibold uppercase tracking-[0.24em]", textMuted)}>
                            {plan.type === "subscription" ? t("subscription_label") : t("buyout_label")}
                        </p>
                        <h3 className="mt-3 text-3xl font-black tracking-tight">{plan.displayName}</h3>
                        <p className={cn("mt-3 text-sm leading-6", textMuted)}>{plan.displayDescription}</p>
                    </div>

                    <div className="flex items-end gap-2">
                        <span className={cn("text-5xl font-black tracking-tight", isYearly ? "text-white" : "text-foreground")}>
                            {formatPrice(plan.price)}
                        </span>
                        {plan.interval ? (
                            <span className={cn("pb-2 text-base", textMuted)}>
                                / {plan.interval === "month" ? t("month") : t("year")}
                            </span>
                        ) : null}
                    </div>

                    {isYearly ? (
                        <div className="text-sm">
                            <span className="text-slate-300">{t("cards.yearly.subtitle_prefix")} </span>
                            <span className="font-semibold text-rose-300 line-through">{formatPrice(PLAN_PRO_MONTHLY.price)}</span>
                            <span className="text-slate-300"> </span>
                            <span className="font-semibold text-white">{formatPrice(PLAN_PRO_YEARLY.price / 12)}/mo</span>
                        </div>
                    ) : (
                        <p className={cn("text-sm", textMuted)}>
                            {isStarter || isPack ? t("one_time_payment") : t("cards.monthly.subtitle")}
                        </p>
                    )}

                    <div className={cn("rounded-2xl border px-4 py-4", isYearly ? "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : isMonthly ? "border-primary/15 bg-primary/5" : "border-border/60 bg-muted/30")}>
                        <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", textMuted)}>
                            {t("price_per_image")}
                        </p>
                        <p className={cn("mt-2 text-2xl font-black", anchorClass)}>
                            {t("only_price_per_image", { price: costPerImage.toFixed(2) })}
                        </p>
                        {isMonthly ? (
                            <p className="mt-2 text-sm font-semibold text-emerald-600">{t("cards.monthly.anchor")}</p>
                        ) : null}
                        {isYearly ? (
                            <p className="mt-2 text-sm font-semibold text-emerald-300">{t("cards.yearly.anchor")}</p>
                        ) : null}
                    </div>
                </div>

                <div className={cn("my-5 border-t", divider)} />

                <div className="flex-1">
                    {renderFeatures(coreFeatures, { yearly: isYearly })}

                    {missingFeatures.length > 0 ? (
                        <div className={cn("mt-5 rounded-2xl border px-4 py-4", isYearly ? "border-white/10 bg-white/5" : "border-border/50 bg-muted/20")}>
                            <p className={cn("mb-3 text-xs font-semibold uppercase tracking-[0.22em]", textMuted)}>
                                {t("missing_features")}
                            </p>
                            {renderFeatures(missingFeatures, { dimmed: true, yearly: isYearly })}
                        </div>
                    ) : null}
                </div>

                <div className="mt-auto pt-6">
                    <Button
                        className={cn("h-12 w-full rounded-xl font-semibold", buttonClass)}
                        onClick={() => handlePurchase(plan)}
                        disabled={!!loadingPlanId}
                    >
                        {isMonthly ? (
                            <span className="pointer-events-none absolute inset-y-0 left-[-35%] w-1/3 skew-x-[-20deg] bg-white/25 blur-xl transition-transform duration-700 group-hover:translate-x-[420%]" />
                        ) : null}
                        {loadingPlanId === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isStarter
                            ? t("cards.starter.cta")
                            : isPack
                                ? t("cards.pro_pack.cta")
                                : isMonthly
                                    ? t("cards.monthly.cta")
                                    : t("cards.yearly.cta")}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <section className="relative isolate overflow-visible">
            <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_10%,rgba(244,114,182,0.12),transparent_24%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.14),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f8fafc_100%)]" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(circle_at_center,black,transparent_85%)]" />

            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <span className="inline-flex rounded-full border border-primary/15 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary shadow-sm">
                        {t("eyebrow")}
                    </span>
                    <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">{t("title")}</h2>
                    <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{t("subtitle")}</p>
                </div>

                <div className="mt-14 overflow-x-auto overflow-y-visible pb-6 pt-6 [scrollbar-width:none]">
                    <div className="grid min-w-[1180px] snap-x snap-mandatory grid-cols-4 items-stretch gap-6 px-1 lg:min-w-0">
                        {plans.map(renderCard)}
                    </div>
                </div>

                <div className="mt-12 rounded-[28px] border border-amber-300/50 bg-amber-50 px-6 py-5 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">{t("faq_kicker")}</p>
                    <p className="mt-3 text-base leading-8 text-amber-950">{t("artist_anchor")}</p>
                </div>
            </div>
        </section>
    );
}

export default PricingSection;
