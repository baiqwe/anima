"use client";

import { signOutAction } from "@/app/actions";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { Logo } from "./logo";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/use-user";
import { Link } from "@/i18n/routing";
import { Skeleton } from "./ui/skeleton";

interface NavItem {
  label: string;
  href: string;
}

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const isDashboard = pathname?.startsWith("/dashboard");
  const { user, loading } = useUser();

  // 更可靠地检测当前 locale
  const pathParts = pathname?.split('/') || [];
  const currentLocale = (pathParts[1] === 'en' || pathParts[1] === 'zh') ? pathParts[1] : 'en';
  const localePrefix = `/${currentLocale}`;

  // 获取不带 locale 前缀的路径（用于语言切换）
  const getPathWithoutLocale = () => {
    if (!pathname) return '/';
    // 如果路径以 /en 或 /zh 开头，移除它
    const withoutLocale = pathname.replace(/^\/(en|zh)/, '');
    return withoutLocale || '/';
  };

  const pathWithoutLocale = getPathWithoutLocale();

  // Main navigation items
  const mainNavItems: NavItem[] = [
    { label: t('home'), href: localePrefix },
    { label: t('tools'), href: localePrefix },
    { label: t('pricing'), href: `${localePrefix}/pricing` },
    { label: t('about'), href: `${localePrefix}/about` },
  ];

  // Dashboard items
  const dashboardItems: NavItem[] = [];
  const navItems = isDashboard ? dashboardItems : mainNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Centered Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-lg font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language Switcher - 修复后的版本 */}
          <div className="hidden md:flex items-center gap-1 mr-2">
            <Link
              href={pathWithoutLocale}
              locale="en"
              className={`px-2 py-1 rounded text-sm transition-colors ${currentLocale === 'en'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              EN
            </Link>
            <Link
              href={pathWithoutLocale}
              locale="zh"
              className={`px-2 py-1 rounded text-sm transition-colors ${currentLocale === 'zh'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              中文
            </Link>
          </div>

          <ThemeSwitcher />
          {loading ? (
            <div className="hidden md:flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
            </div>
          ) : user ? (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link href={`${localePrefix}/dashboard`}>
                  {currentLocale === 'zh' ? '控制台' : 'Dashboard'}
                </Link>
              </Button>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  {t('sign_out')}
                </Button>
              </form>
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`${localePrefix}/sign-in`}>{t('sign_in')}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`${localePrefix}/sign-up`}>{t('sign_up')}</Link>
              </Button>
            </div>
          )}
          <MobileNav items={navItems} user={user} loading={loading} isDashboard={isDashboard} currentLocale={currentLocale} />
        </div>
      </div>
    </header>
  );
}
