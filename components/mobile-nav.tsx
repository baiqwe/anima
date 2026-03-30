"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";

interface MobileNavProps {
  items: { label: string; href: string }[];
  user: any;
  loading?: boolean;
  isDashboard: boolean;
  currentLocale?: string;
}

export function MobileNav({ items, user, loading = false, isDashboard, currentLocale = 'en' }: MobileNavProps) {
  const pathname = usePathname();
  const localePrefix = `/${currentLocale}`;

  // 获取不带 locale 前缀的路径
  const getPathWithoutLocale = () => {
    if (!pathname) return '/';
    const withoutLocale = pathname.replace(/^\/(en|zh)/, '');
    return withoutLocale || '/';
  };

  const pathWithoutLocale = getPathWithoutLocale();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{currentLocale === 'zh' ? '导航' : 'Navigation'}</SheetTitle>
        </SheetHeader>

        {/* Language Switcher for Mobile */}
        <div className="flex items-center gap-2 mt-4 pb-4 border-b">
          <span className="text-sm text-muted-foreground">
            {currentLocale === 'zh' ? '语言:' : 'Language:'}
          </span>
          <Link
            href={pathWithoutLocale}
            locale="en"
            className={`px-3 py-1.5 rounded text-sm transition-colors ${currentLocale === 'en'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            EN
          </Link>
          <Link
            href={pathWithoutLocale}
            locale="zh"
            className={`px-3 py-1.5 rounded text-sm transition-colors ${currentLocale === 'zh'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            中文
          </Link>
        </div>

        <nav className="flex flex-col gap-4 mt-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-lg font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t">
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : user ? (
            <div className="flex flex-col gap-2">
              <Button asChild variant="default" className="w-full">
                <Link href={`${localePrefix}/dashboard`}>
                  {currentLocale === 'zh' ? '控制台' : 'Dashboard'}
                </Link>
              </Button>
              <form action={signOutAction} className="w-full">
                <Button type="submit" variant="outline" className="w-full">
                  {currentLocale === 'zh' ? '退出登录' : 'Sign out'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href={`${localePrefix}/sign-in`}>
                  {currentLocale === 'zh' ? '登录' : 'Sign in'}
                </Link>
              </Button>
              <Button asChild variant="default" className="w-full">
                <Link href={`${localePrefix}/sign-up`}>
                  {currentLocale === 'zh' ? '注册' : 'Sign up'}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
