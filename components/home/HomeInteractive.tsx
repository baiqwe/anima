'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { AnimeImageEditor } from '@/components/feature/anime-image-editor';
import type { AnimeStyleId } from '@/config/landing-pages';
import { HeroStylePreview } from '@/components/gallery/HeroStylePreview';

interface HomeInteractiveProps {
    onShowStaticContent: (show: boolean) => void;
    user?: any;
}

export default function HomeInteractive({ onShowStaticContent, user }: HomeInteractiveProps) {
    return (
        <HeroWithUploadSection onShowStaticContent={onShowStaticContent} user={user} />
    );
}

function HeroWithUploadSection({
    onShowStaticContent,
    user
}: {
    onShowStaticContent: (show: boolean) => void;
    user?: any;
}) {
    const t = useTranslations('hero');
    const pathname = usePathname();
    const pathParts = pathname?.split('/') || [];
    const locale = (pathParts[1] === 'en' || pathParts[1] === 'zh') ? pathParts[1] : 'en';

    return (
        <AnimeImageEditor
            locale={locale}
            user={user}
            title={t('tool_title')}
            subtitle={t('tool_subtitle')}
            defaultStyle={"standard" as AnimeStyleId}
            hideStyleSelector={false}
            onImageUploaded={(uploaded) => onShowStaticContent(!uploaded)}
            compact={false}
            emptyAside={<HeroStylePreview locale={locale} />}
        />
    );
}

// Export visibility control hook for parent component
export function useHomeInteractive() {
    return { showStaticContent: true, setShowStaticContent: () => {} };
}
