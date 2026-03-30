import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, AlertTriangle, Database, Share2 } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  const isZh = locale === "zh";

  const title = isZh ? `隐私政策 | ${site.siteName}` : `Privacy Policy | ${site.siteName}`;
  const description = isZh
    ? "了解我们如何处理你上传的图片、生成结果、账号信息，以及与第三方 AI 服务的交互。"
    : "Learn how we handle uploads, generated images, account data, and interactions with third-party AI services.";

  const ogImage = new URL(site.ogImagePath, site.siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: { en: "/en/privacy", zh: "/zh/privacy", "x-default": "/en/privacy" },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: new URL(`/${locale}/privacy`, site.siteUrl).toString(),
      siteName: site.siteName,
      images: [{ url: ogImage, width: 512, height: 512, alt: site.siteName }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function PrivacyPage(props: { params: Promise<{ locale: string }> }) {
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
        <div className="max-w-4xl mx-auto space-y-8">
          <Breadcrumbs
            items={[
              { name: isZh ? "首页" : "Home", href: localePrefix },
              { name: isZh ? "隐私政策" : "Privacy Policy", href: `${localePrefix}/privacy` },
            ]}
          />
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{isZh ? "隐私政策" : "Privacy Policy"}</h1>
            <p className="text-muted-foreground">
              {isZh
                ? "本页面是第一版简化说明，后续会随着产品与合规需求迭代。"
                : "This is a simplified v1 policy and will evolve as the product and compliance needs change."}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                {isZh ? "图片处理与第三方服务" : "Uploads & Third-Party AI Services"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                {isZh
                  ? "为了生成动漫风格图片，你上传的图片会被发送到第三方 AI 服务进行处理。"
                  : "To generate anime-style images, your uploads are sent to a third-party AI service for processing."}
              </p>
              <p>
                {isZh
                  ? "第三方服务可能会出于提供服务、监控滥用或改进质量等目的处理相关数据。"
                  : "Third-party providers may process data for service delivery, abuse prevention, and quality improvements."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                {isZh ? "我们会保存什么" : "What We Store"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                {isZh
                  ? "我们可能会保存与你的账号相关的基础信息（例如用户 ID）以及生成记录（例如提示词、风格参数、生成状态）。"
                  : "We may store basic account identifiers (e.g., user ID) and generation logs (prompt, style parameters, status)."}
              </p>
              <p>
                {isZh
                  ? "生成结果可能以链接或数据形式返回；具体存储策略会根据部署与成本策略调整。"
                  : "Generated results may be returned as URLs or data; storage strategy may change based on deployment and cost."}
              </p>
              <p>
                {isZh
                  ? "默认情况下，我们只保留运行服务所需的最少信息，并会根据安全、计费、故障排查需要设置有限保留周期。"
                  : "By default, we keep the minimum information needed to operate the service, with limited retention windows for security, billing, and troubleshooting."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {isZh ? "安全与删除" : "Security & Deletion"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                {isZh
                  ? "我们采取合理的技术措施保护数据安全，但无法保证互联网传输与第三方服务绝对安全。"
                  : "We take reasonable measures to protect data, but cannot guarantee absolute security over the internet or third-party services."}
              </p>
              <p>
                {isZh
                  ? "如需删除账号或数据，请通过站内联系方式联系我们。"
                  : "To request deletion of your account or data, contact us through the support address below."}
              </p>
              <p>
                {isZh
                  ? `联系邮箱：${site.supportEmail}`
                  : `Support email: ${site.supportEmail}`}
              </p>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100 p-5 flex gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div className="text-sm leading-relaxed">
              {isZh
                ? "请不要上传包含敏感个人信息的图片。你对上传内容拥有权利并对其负责。"
                : "Please do not upload sensitive personal information. You must have rights to the content you upload and are responsible for it."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
