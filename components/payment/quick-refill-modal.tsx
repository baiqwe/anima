"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { PLAN_MINI, PLAN_PRO_MONTHLY, PricingPlan } from "@/config/credit-packs";
import { toast } from "@/hooks/use-toast";

interface QuickRefillModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPath?: string;
}

export function QuickRefillModal({ isOpen, onClose, currentPath }: QuickRefillModalProps) {
    const t = useTranslations('Pricing');
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);

    const handlePurchase = async (plan: PricingPlan) => {
        try {
            setLoadingPlanId(plan.id);

            // Construct local redirect URL to return to current work
            const returnUrl = new URL(window.location.href);
            returnUrl.searchParams.set('checkout', 'success');
            // Add a timestamp to force refresh if needed
            returnUrl.searchParams.set('ts', Date.now().toString());

            const formData = new FormData();
            formData.append('priceId', plan.productId);
            formData.append('productType', plan.type === 'subscription' ? 'subscription' : 'credits');

            if (plan.credits) {
                formData.append('credits', plan.credits.toString());
            }

            formData.append('redirectUrl', returnUrl.toString());

            const response = await fetch('/api/creem/checkout', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Checkout failed');
            }

            if (data.checkout_url) {
                // Before redirecting, we could emit an event or rely on parent to save state
                // But typically parent captures input state. 
                // We just redirect.
                window.location.href = data.checkout_url;
            } else {
                console.error('No checkout URL', data);
                toast({
                    title: t('error'),
                    description: "Failed to initialize checkout.",
                    variant: "destructive"
                });
            }

        } catch (error) {
            console.error('Payment error:', error);
            toast({
                title: t('error'),
                description: "Failed to start payment process.",
                variant: "destructive"
            });
        } finally {
            setLoadingPlanId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <span className="text-2xl">⚡️</span>
                        {t('refill_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('refill_subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Option A: Pro (Hero) */}
                    <div className="relative">
                        <div className="absolute -top-3 right-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse">
                            RECOMMENDED
                        </div>
                        <Button
                            className="w-full h-auto py-4 flex flex-col items-center gap-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 border-0"
                            onClick={() => handlePurchase(PLAN_PRO_MONTHLY)}
                            disabled={!!loadingPlanId}
                        >
                            {loadingPlanId === PLAN_PRO_MONTHLY.id ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-lg font-bold flex items-center gap-2">
                                        <Zap className="fill-yellow-400 text-yellow-400 h-5 w-5" />
                                        {t('refill_upgrade')}
                                    </span>
                                    <span className="text-primary-foreground/80 text-sm font-normal">
                                        {formatPrice(PLAN_PRO_MONTHLY.price)} / {t('month')} • {PLAN_PRO_MONTHLY.credits} {t('credits')}
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    {/* Option B: Mini */}
                    <Button
                        variant="outline"
                        className="w-full h-auto py-3 text-muted-foreground hover:text-foreground"
                        onClick={() => handlePurchase(PLAN_MINI)}
                        disabled={!!loadingPlanId}
                    >
                        {loadingPlanId === PLAN_MINI.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <span>{t('refill_mini')} ({PLAN_MINI.credits} pts)</span>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
