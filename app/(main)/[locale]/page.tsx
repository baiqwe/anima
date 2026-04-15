import HomeClientWrapper from '@/components/home/HomeClientWrapper';
import HomeHeroContent from '@/components/home/HomeHeroContent';
import HomeStaticContent from '@/components/home/HomeStaticContent';
import type { Metadata } from "next";
import { getMessages } from "next-intl/server";
import { site } from "@/config/site";
import { buildLocaleAlternates } from "@/utils/seo/metadata";
import { ImageGallerySchema } from "@/components/gallery/ImageGallerySchema";

// ✅ This is now a Server Component (no 'use client')
// Hero/Interactive content is client-side, static content is server-rendered for SEO

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const params = await props.params;
    const { locale } = params;
    const messages = await getMessages({ locale }) as {
        metadata: { title: string; description: string; keywords: string };
    };
    const canonical = `/${locale}`;
    const ogImage = new URL(site.ogImagePath, site.siteUrl).toString();

    return {
        title: messages.metadata.title,
        description: messages.metadata.description,
        keywords: messages.metadata.keywords.split(",").map((keyword) => keyword.trim()),
        alternates: buildLocaleAlternates(canonical),
        openGraph: {
            title: messages.metadata.title,
            description: messages.metadata.description,
            url: new URL(canonical, site.siteUrl).toString(),
            images: [{ url: ogImage, width: 512, height: 512, alt: site.siteName }],
        },
        twitter: {
            card: "summary_large_image",
            title: messages.metadata.title,
            description: messages.metadata.description,
            images: [ogImage],
        },
    };
}

export default async function HomePage(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;

    // Server-rendered static content for better LCP and SEO
    const heroContent = await HomeHeroContent({ locale });
    const staticContent = await HomeStaticContent({ locale });

    return (
        <>
            <ImageGallerySchema locale={locale} />
            <HomeClientWrapper heroContent={heroContent} staticContent={staticContent} />
        </>
    );
}
