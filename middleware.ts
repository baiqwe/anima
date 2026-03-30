import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { hasSupabaseEnv } from './utils/supabase/env'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. 先运行 intl 中间件，获取基础 Response (包含语言 Cookie 和重定向逻辑)
  let response = intlMiddleware(request)

  // Preview mode: allow local UI review without Supabase env configured.
  if (!hasSupabaseEnv()) {
    return response
  }

  const pathname = request.nextUrl.pathname
  const isProtectedRoute =
    /^\/dashboard(?:\/|$)/.test(pathname) ||
    /^\/(en|zh)\/dashboard(?:\/|$)/.test(pathname)

  // Public marketing and SEO pages should bypass Supabase entirely so they can
  // return from cache/CDN without paying the auth round-trip cost.
  if (!isProtectedRoute) {
    return response
  }

  // 2. 初始化 Supabase 客户端
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 同时更新 request 和 response
          // 更新 request 是为了让后续逻辑能读到最新 Cookie
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          // 更新 response 是为了写入浏览器
          // 关键点：我们直接修改 intl 返回的那个 response 对象，而不是创建新的
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 3. 刷新 Session (这会触发上面的 setAll)
  // 重要：不要在这里写 user 变量的逻辑判断，只负责刷新 Cookie
  await supabase.auth.getUser()

  return response
}

export const config = {
  // 排除 api, _next, 静态资源，以及 auth/callback (新位置)
  matcher: ['/((?!api|_next|_vercel|auth/callback|.*\\..*).*)', '/(en|zh)/:path*']
}
