import Link from "next/link";
import { Metadata } from "next";
import { site } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Shield, Zap } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  const isZh = locale === "zh";

  const title = isZh ? `关于我们 | ${site.siteName}` : `About | ${site.siteName}`;
  const description = isZh
    ? "我们打造照片转二次元的 AI 工具：更简单的工作流、更清晰的风格选择、更好的出图体验。"
    : "We build Photo-to-Anime AI tools with simple workflows, clear style choices, and great results.";

  const ogImage = new URL(site.ogImagePath, site.siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        en: "/en/about",
        zh: "/zh/about",
        "x-default": "/en/about",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: new URL(`/${locale}/about`, site.siteUrl).toString(),
      siteName: site.siteName,
      images: [{ url: ogImage, width: 512, height: 512, alt: site.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function AboutPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const { locale } = params;
  const isZh = locale === "zh";
  const localePrefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 md:px-6 py-4">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={localePrefix}>
              <ArrowLeft className="h-4 w-4" />
              {isZh ? "返回首页" : "Back to Home"}
            </Link>
          </Button>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <Breadcrumbs
            items={[
              { name: isZh ? "首页" : "Home", href: localePrefix },
              { name: isZh ? "关于我们" : "About", href: `${localePrefix}/about` },
            ]}
          />
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {isZh ? `关于 ${site.siteName}` : `About ${site.siteName}`}
            </h1>
            <p className="text-lg text-muted-foreground">
              {isZh
                ? "把你的照片转换成高质量的动漫风格图像，用于头像、社交分享、创作灵感。"
                : "Turn your photos into high-quality anime-style images for avatars, sharing, and creative inspiration."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {isZh ? "风格优先" : "Style First"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {isZh ? "围绕二次元用户的审美与细节偏好设计风格与参数。" : "Designed around anime aesthetics and creator expectations."}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-primary" />
                  {isZh ? "简单工作流" : "Simple Workflow"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {isZh ? "上传 → 选风格 → 调浓度 → 生成下载。" : "Upload → pick a style → adjust intensity → generate & download."}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  {isZh ? "透明说明" : "Transparent Policy"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {isZh
                  ? "为完成 AI 生成，我们会把图片发送到第三方 AI 服务处理；更多细节请见隐私政策。"
                  : "To generate images, we send your uploads to a third-party AI service; see Privacy Policy for details."}
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button asChild size="lg">
              <Link href={`${localePrefix}`}>{isZh ? "开始生成" : "Start Generating"}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
