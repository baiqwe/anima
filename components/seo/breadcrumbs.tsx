import Link from "next/link";
import { BreadcrumbSchema } from "@/components/breadcrumb-schema";

export type BreadcrumbItem = {
  name: string;
  href: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <>
      <BreadcrumbSchema items={items.map((item) => ({ name: item.name, url: item.href }))} />
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page" className="font-medium text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="hover:text-foreground transition-colors">
                    {item.name}
                  </Link>
                )}
                {!isLast ? <span>/</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
