// config/credit-packs.ts

export type PricingPlan = {
    id: string;
    productId: string; // Creem Product ID
    name: string;
    nameZh: string;
    price: number;       // 美元价格
    credits: number;     // 获得的积分
    type: 'one_time' | 'subscription';
    interval?: 'month' | 'year';
    label?: string;      // 营销标签
    labelZh?: string;
    description?: string;
    descriptionZh?: string;
    isPopular?: boolean;
    originalPrice?: number; // 原价（用于展示划线价格或计算折扣）
    badge?: string;
    badgeZh?: string;
};

// 1 credit = 1 generation (new users start with a small free allowance)
export const CREDITS_PER_GENERATION = 1;

// === 核心定价策略 ===

// 1. Buy-out: Starter Pack
export const PLAN_MINI: PricingPlan = {
    id: "mini_refill",
    productId: "prod_53WEfYlCnhJ5bqmMjhjtE0",
    name: "Starter Pack",
    nameZh: "入门买断包",
    price: 4.99,
    credits: 10,
    type: 'one_time',
    description: "A quick 10-credit drop for first-time tries.",
    descriptionZh: "先试 10 次，适合轻量体验。",
    originalPrice: 6.99
};

// 2. Subscription: Pro Monthly
export const PLAN_PRO_MONTHLY: PricingPlan = {
    id: "pro_monthly",
    productId: "prod_4pBVe6NzowRcuNB77DECWu",
    name: "Pro Monthly",
    nameZh: "Pro 月订阅",
    price: 29.99,
    credits: 100,
    type: 'subscription',
    interval: 'month',
    label: "Most Popular",
    labelZh: "最受欢迎",
    isPopular: true,
    description: "100 monthly credits plus all Pro privileges.",
    descriptionZh: "每月 100 积分，并解锁全部 Pro 特权。",
    originalPrice: 49.99,
    badge: "Save 40%",
    badgeZh: "立省 40%"
};

export const PLAN_PRO_YEARLY: PricingPlan = {
    id: "pro_yearly",
    productId: "prod_6Yo0APx53tCUDX0ph4RBWe",
    name: "Pro Yearly",
    nameZh: "Pro 年订阅",
    price: 249.99,
    credits: 1200,
    type: 'subscription',
    interval: 'year',
    label: "Best Value",
    labelZh: "最佳价值",
    isPopular: true,
    description: "1200 yearly credits with the lowest per-image cost.",
    descriptionZh: "每年 1200 积分，单次成本最低。",
    originalPrice: 359.88,
    badge: "2 Months Free",
    badgeZh: "送 2 个月"
};

// 3. Buy-out: Creator Pack
export const PLAN_ANCHOR: PricingPlan = {
    id: "lifetime_anchor",
    productId: "prod_74hGM82264trVHdwGAP897",
    name: "Pro Pack",
    nameZh: "Pro 买断包",
    price: 19.99,
    credits: 50,
    type: 'one_time',
    description: "A larger one-time pack with watermark-free exports.",
    descriptionZh: "更大的单次买断包，并支持无水印导出。",
    originalPrice: 24.99
};

export const ALL_PLANS = [PLAN_MINI, PLAN_PRO_MONTHLY, PLAN_PRO_YEARLY, PLAN_ANCHOR];

// 辅助函数：计算单次生成的成本
export function calculateCostPerGeneration(plan: PricingPlan): number {
    const generations = plan.credits / CREDITS_PER_GENERATION;
    return plan.price / generations;
}

// 获取本地化的包信息
export function getLocalizedPlan(plan: PricingPlan, locale: string) {
    return {
        ...plan,
        displayName: locale === 'zh' ? plan.nameZh : plan.name,
        displayLabel: locale === 'zh' ? plan.labelZh : plan.label,
        displayDescription: locale === 'zh' ? plan.descriptionZh : plan.description,
        displayBadge: locale === 'zh' ? plan.badgeZh : plan.badge,
    };
}
