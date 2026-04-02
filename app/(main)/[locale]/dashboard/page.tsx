import { createClient } from "@/utils/supabase/server";
import { getProjectId } from "@/utils/supabase/project";
import { redirect } from "next/navigation";
import { SubscriptionStatusCard } from "@/components/dashboard/subscription-status-card";
import { CreditsBalanceCard } from "@/components/dashboard/credits-balance-card";

export const runtime = 'edge';

export default async function DashboardPage(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect(`/${locale}/sign-in`);
    }

    let subscription: {
        status: string;
        current_period_end: string;
        creem_product_id?: string;
    } | null = null;
    let credits = 0;

    try {
        const projectId = await getProjectId(supabase);

        const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select(
                `
        *,
        subscriptions (
          status,
          current_period_end,
          creem_product_id
        )
      `
            )
            .eq("project_id", projectId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (customerError) {
            console.error("Failed to load dashboard customer data:", customerError);
        } else if (customerData) {
            subscription = customerData.subscriptions?.[0] ?? null;
            credits = customerData.credits || 0;
        }
    } catch (error) {
        console.error("Failed to load dashboard project data:", error);
    }

    const welcomeText = locale === 'zh' ? '欢迎回来' : 'Welcome back';
    const manageText = locale === 'zh' ? '在这里管理您的订阅和积分。' : 'Manage your subscription and credits here.';
    const accountText = locale === 'zh' ? '账户信息' : 'Account Information';
    const emailText = locale === 'zh' ? '邮箱' : 'Email';
    const userIdText = locale === 'zh' ? '用户 ID' : 'User ID';

    return (
        <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8 px-4 sm:px-8 container py-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border rounded-lg p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
                    {welcomeText}, <span className="text-primary">{user.email}</span>
                </h1>
                <p className="text-muted-foreground">
                    {manageText}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <SubscriptionStatusCard subscription={subscription} />
                <CreditsBalanceCard credits={credits} locale={locale} />
            </div>

            {/* Account Details */}
            <div className="rounded-xl border bg-card p-6">
                <h2 className="font-bold text-lg mb-4">{accountText}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">{emailText}</p>
                        <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">{userIdText}</p>
                        <p className="font-medium text-xs font-mono bg-muted p-1 rounded inline-block">
                            {user.id}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
