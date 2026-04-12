import rawLandingPages from "./landing-pages.json";

export type AnimeStyleId = "standard" | "ghibli" | "cyberpunk" | "retro_90s" | "webtoon" | "cosplay";

export type LandingPageFaq = { question: string; answer: string };

export type LandingPageConfig = {
  slug: string;
  targetKeyword: string;
  title: string;
  description: string;
  h1: string;
  subtitle: string;
  defaultStyle: AnimeStyleId;
  hideStyleSelector?: boolean;
  faqs: LandingPageFaq[];
};

type LandingPageLocalizedCopy = {
  titleZh: string;
  descriptionZh: string;
  h1Zh: string;
  subtitleZh: string;
  faqsZh: LandingPageFaq[];
};

export const landingPages = rawLandingPages as Record<string, LandingPageConfig>;

const landingPagesZh: Record<string, LandingPageLocalizedCopy> = {
  "photo-to-anime": {
    titleZh: "【免费体验】照片转二次元 AI - 一键在线生成绝美动漫头像",
    descriptionZh: "想要看到你的二次元分身吗？立即免费体验最懂你的 AI 照片转二次元生成器！只需上传自拍，一键解锁吉卜力、韩漫、90年代复古等多种动漫滤镜。",
    h1Zh: "免费照片转二次元 AI 生成器",
    subtitleZh: "几秒内把任意照片变成动漫风格作品。选择风格、调整浓度，生成你的全新二次元形象。",
    faqsZh: [
      {
        question: "需要注册吗？",
        answer: "要生成图片仍然需要账号，不过新用户会有少量免费额度可以先体验。"
      },
      {
        question: "生成后还会像我吗？",
        answer: "我们的风格会尽量保留你的关键五官特征，同时把整体视觉转成更干净、更统一的二次元风格。"
      }
    ]
  },
  "ghibli-filter": {
    titleZh: "【免费体验】吉卜力滤镜 AI - 一键把照片变成治愈动画感",
    descriptionZh: "上传自拍，一键生成温暖治愈的吉卜力灵感动漫头像。手绘氛围、柔和色彩、电影感十足，轻松做出像动画场景一样的照片效果。",
    h1Zh: "吉卜力风格 AI 滤镜",
    subtitleZh: "把任意照片快速变成带有手绘感与治愈氛围的吉卜力风格作品。",
    faqsZh: [
      {
        question: "这是 Studio Ghibli 官方产品吗？",
        answer: "不是。这是受吉卜力美学启发的 AI 风格滤镜，与 Studio Ghibli 没有官方关联。"
      },
      {
        question: "什么样的照片效果最好？",
        answer: "清晰的人像和光线充足的户外照片通常会得到更稳定、更自然的结果。"
      }
    ]
  },
  "anime-pfp-generator": {
    titleZh: "【免费体验】动漫头像生成器 - 一键定制你的二次元 PFP",
    descriptionZh: "上传自拍，一键生成适合 Discord、Twitch 和社交平台的动漫头像。快速出图，轻松打造更有辨识度的二次元形象。",
    h1Zh: "动漫头像生成器",
    subtitleZh: "用你的真实照片生成专属二次元头像，让个人主页更有辨识度。",
    faqsZh: [
      {
        question: "可以用在 Discord 和 Twitch 吗？",
        answer: "可以。生成结果非常适合做社交平台、游戏社区和直播平台头像。"
      },
      {
        question: "可以一次多生成几种版本吗？",
        answer: "可以，建议多尝试不同风格和浓度，挑出最适合你的版本。"
      }
    ]
  },
  "90s-anime-filter": {
    titleZh: "【免费体验】90年代动漫滤镜 - 一键生成复古赛璐璐动画风",
    descriptionZh: "上传照片，立即变成带有赛璐璐质感和怀旧配色的90年代复古动漫头像。适合想要老动画氛围、复古感和个性化头像的人。",
    h1Zh: "90 年代复古动漫滤镜",
    subtitleZh: "复古赛璐璐涂色、经典线条与怀旧配色，一键还原老动画氛围。",
    faqsZh: [
      {
        question: "什么是 90 年代动漫风？",
        answer: "通常表现为更明显的线稿、赛璐璐式分层上色，以及比现代动漫更柔和的配色。"
      }
    ]
  },
  "cyberpunk-anime": {
    titleZh: "【免费体验】赛博朋克动漫滤镜 - 一键生成霓虹未来风照片",
    descriptionZh: "上传自拍，快速生成霓虹灯感十足的赛博朋克动漫头像。未来感、强对比和科幻氛围一步到位，特别适合玩家和主播。",
    h1Zh: "赛博朋克动漫滤镜",
    subtitleZh: "霓虹、未来感、强对比线条，让你的照片拥有强烈的科幻动漫气质。",
    faqsZh: [
      {
        question: "会自动加上霓虹背景吗？",
        answer: "通常会。赛博朋克风格会倾向加入未来感灯光和氛围，如果你有特殊需求也可以在附加要求里补充。"
      }
    ]
  },
  "webtoon-ai": {
    titleZh: "【免费体验】韩漫风 AI 滤镜 - 一键生成清爽高级感韩漫画风",
    descriptionZh: "上传照片，立即生成线条干净、轮廓利落、气质高级的韩漫风头像。适合喜欢现代感、角色感和精致脸部表现的人像编辑。",
    h1Zh: "韩漫风 AI 滤镜",
    subtitleZh: "简洁造型、清晰线条、易读阴影，让照片拥有现代韩漫质感。",
    faqsZh: [
      {
        question: "韩漫风和动漫风有什么区别？",
        answer: "通常韩漫风会更强调干净轮廓和平面阴影，画面更利落；传统动漫则更强调层次和渲染感。"
      }
    ]
  },
  "cosplay-enhancer": {
    titleZh: "【免费体验】Cos照增强器 - 一键把 Cos 照变成精修动漫插画",
    descriptionZh: "上传 Cosplay 照片，快速生成更精致的动漫风插画效果，尽量保留角色气质和服装特征，适合发图、做头像和角色展示。",
    h1Zh: "Cos 照增强器",
    subtitleZh: "把 Cos 照快速转成更精致的二次元插画，适合分享、发帖和做角色头像。",
    faqsZh: [
      {
        question: "会保留我的服装细节吗？",
        answer: "模型会尽量保留关键轮廓和颜色。为了获得更稳定结果，建议使用清晰、光线充足的照片。"
      }
    ]
  }
};

export function getLandingPage(slug: string): LandingPageConfig | null {
  return landingPages[slug] || null;
}

export function getLocalizedLandingPage(slug: string, locale: string): LandingPageConfig | null {
  const page = getLandingPage(slug);
  if (!page) return null;

  if (locale !== "zh") {
    return page;
  }

  const zhCopy = landingPagesZh[slug];
  if (!zhCopy) {
    return page;
  }

  return {
    ...page,
    title: zhCopy.titleZh,
    description: zhCopy.descriptionZh,
    h1: zhCopy.h1Zh,
    subtitle: zhCopy.subtitleZh,
    faqs: zhCopy.faqsZh,
  };
}

export const landingPageSlugs = Object.keys(landingPages);
export const indexableLandingPageSlugs = landingPageSlugs.filter((slug) => slug !== "photo-to-anime");
