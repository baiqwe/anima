import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { ensureProjectCustomer } from "@/utils/supabase/provision";

export const runtime = 'edge';

// 硬编码 locales 避免导入问题
const LOCALES = ["en", "zh"];
const DEFAULT_LOCALE = "en";

// 从 request cookie header 获取用户语言偏好
function getLocaleFromRequest(request: Request): string {
    try {
        const cookieHeader = request.headers.get("cookie") || "";
        const possibleCookieNames = ["NEXT_LOCALE", "locale", "next-intl-locale"];

        for (const name of possibleCookieNames) {
            const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
            if (match && LOCALES.includes(match[1])) {
                return match[1];
            }
        }
    } catch {
        // ignore
    }
    return DEFAULT_LOCALE;
}

// 解析 cookie string 为对象
function parseCookies(cookieHeader: string): { name: string; value: string }[] {
    if (!cookieHeader) return [];
    try {
        return cookieHeader.split(';').map(cookie => {
            const [name, ...rest] = cookie.trim().split('=');
            return { name: name || '', value: rest.join('=') };
        }).filter(c => c.name);
    } catch {
        return [];
    }
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    try {
        const code = requestUrl.searchParams.get("code");
        const errorParam = requestUrl.searchParams.get("error");
        const errorDescription = requestUrl.searchParams.get("error_description");
        const locale = getLocaleFromRequest(request);

        // 如果 OAuth 返回了错误
        if (errorParam) {
            return NextResponse.redirect(
                `${origin}/${locale}/sign-in?error=${encodeURIComponent(errorDescription || errorParam)}`
            );
        }

        if (!code) {
            return NextResponse.redirect(`${origin}/${locale}/sign-in?error=no_code`);
        }

        // 检查环境变量
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.redirect(`${origin}/${locale}/sign-in?error=config_error`);
        }

        const cookieHeader = request.headers.get("cookie") || "";
        const cookies = parseCookies(cookieHeader);
        const cookiesToSet: { name: string; value: string; options?: any }[] = [];

        const supabase = createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
                getAll() {
                    return cookies;
                },
                setAll(newCookies) {
                    cookiesToSet.push(...newCookies);
                },
            },
        });

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            return NextResponse.redirect(
                `${origin}/${locale}/sign-in?error=${encodeURIComponent(error.message)}`
            );
        }

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            return NextResponse.redirect(
                `${origin}/${locale}/sign-in?error=${encodeURIComponent(userError.message)}`
            );
        }

        if (user) {
            await ensureProjectCustomer(user);
        }

        // 成功 - 重定向到首页
        const response = NextResponse.redirect(`${origin}/${locale}`);

        // 设置 session cookies
        for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
        }

        return response;

    } catch (err: any) {
        // 发生异常时返回一个安全的重定向
        return NextResponse.redirect(
            `${origin}/en/sign-in?error=${encodeURIComponent(err?.message || 'unexpected_error')}`
        );
    }
}
