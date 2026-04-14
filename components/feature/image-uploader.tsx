"use client";

import { useCallback, useId, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Lock, Upload } from 'lucide-react';
import Image from 'next/image';
import type { AnimeStyleId } from '@/config/landing-pages';

interface ImageUploaderProps {
    onImageSelect: (imageSrc: string, file: File) => void;
    onHeicConvert?: (file: File) => Promise<string>;
    onDemoPresetSelect?: (style: AnimeStyleId) => void;
}

const DEMO_IMAGES: Array<{
    id: AnimeStyleId;
    previewSrc: string;
    uploadSrc: string;
    labelEn: string;
    labelZh: string;
}> = [
    {
        id: "standard",
        previewSrc: "/images/gallery/generated/standard.jpg",
        uploadSrc: "/images/gallery/hero-before.jpg",
        labelEn: "Classic",
        labelZh: "标准",
    },
    {
        id: "ghibli",
        previewSrc: "/images/gallery/generated/ghibli.jpg",
        uploadSrc: "/images/gallery/hero-before.jpg",
        labelEn: "Ghibli",
        labelZh: "吉卜力",
    },
    {
        id: "webtoon",
        previewSrc: "/images/gallery/generated/webtoon.jpg",
        uploadSrc: "/images/gallery/hero-before.jpg",
        labelEn: "Webtoon",
        labelZh: "韩漫",
    },
    {
        id: "retro_90s",
        previewSrc: "/images/gallery/generated/retro_90s.jpg",
        uploadSrc: "/images/gallery/hero-before.jpg",
        labelEn: "90s",
        labelZh: "90年代",
    },
    {
        id: "cyberpunk",
        previewSrc: "/images/gallery/generated/cyberpunk.jpg",
        uploadSrc: "/images/gallery/hero-before.jpg",
        labelEn: "Cyber",
        labelZh: "赛博",
    },
    {
        id: "cosplay",
        previewSrc: "/images/gallery/generated/cosplay.jpg",
        uploadSrc: "/images/gallery/hero-before.jpg",
        labelEn: "Cosplay",
        labelZh: "重绘",
    },
] as const;

export default function ImageUploader({ onImageSelect, onHeicConvert, onDemoPresetSelect }: ImageUploaderProps) {
    const t = useTranslations('uploader');
    const locale = useLocale();
    const [error, setError] = useState<string>('');
    const maxSize = 15 * 1024 * 1024; // 15MB
    const titleId = useId();
    const helperId = useId();
    const errorId = useId();
    const fileInputId = useId();

    const readFileAsDataUrl = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            onImageSelect(result, file);
        };
        reader.readAsDataURL(file);
    }, [onImageSelect]);

    const getRejectionMessage = useCallback((rejections: FileRejection[]) => {
        const firstError = rejections[0]?.errors[0];

        if (!firstError) {
            return t('error_invalid');
        }

        if (firstError.code === 'file-too-large') {
            return t('error_size');
        }

        if (firstError.code === 'file-invalid-type') {
            return t('error_invalid');
        }

        return firstError.message || t('error_invalid');
    }, [t]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setError('');

        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];

        if (file.size > maxSize) {
            setError(t('error_size'));
            return;
        }

        try {
            // Handle HEIC files
            if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
                if (onHeicConvert) {
                    const convertedSrc = await onHeicConvert(file);
                    onImageSelect(convertedSrc, file);
                } else {
                    setError('HEIC conversion not supported');
                }
                return;
            }

            // Handle regular image files
            if (!file.type.startsWith('image/')) {
                setError(t('error_invalid'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                onImageSelect(result, file);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('Failed to load image');
            console.error(err);
        }
    }, [onImageSelect, onHeicConvert, t]);

    const handleDemoClick = useCallback(async (url: string, style: AnimeStyleId) => {
        setError('');
        onDemoPresetSelect?.(style);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch demo image: ${response.status}`);
            }

            const blob = await response.blob();
            const extension = blob.type.includes("png") ? "png" : "jpg";
            const file = new File([blob], `demo-image.${extension}`, { type: blob.type || "image/jpeg" });
            readFileAsDataUrl(file);
        } catch (err) {
            console.error("Failed to load demo image", err);
            setError(t('error_demo'));
        }
    }, [onDemoPresetSelect, readFileAsDataUrl, t]);

    const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
        setError(getRejectionMessage(fileRejections));
    }, [getRejectionMessage]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.heic']
        },
        multiple: false,
        maxSize
    });

    const describedBy = error ? `${helperId} ${errorId}` : helperId;

    return (
        <div className="w-full">
            <div
                {...getRootProps({
                    'aria-labelledby': titleId,
                    'aria-describedby': describedBy,
                })}
                className={`
          relative overflow-hidden rounded-[28px] border-2 border-dashed p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.96))] hover:border-primary/50 hover:bg-muted/20'
                    }
        `}
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(227,104,74,0.08),transparent_24%),radial-gradient(circle_at_100%_0%,rgba(27,163,147,0.1),transparent_20%)]" />
                <input
                    {...getInputProps({
                        id: fileInputId,
                        'aria-label': t('title'),
                        'aria-describedby': describedBy,
                        'aria-invalid': error ? true : undefined,
                    })}
                />

                <div className="relative flex flex-col items-center gap-4">
                    <div className={`
            rounded-full p-4 transition-colors
            ${isDragActive ? 'bg-primary/20' : 'bg-background/90 shadow-sm'}
          `}>
                        <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden="true" />
                    </div>

                    <div className="space-y-2">
                        <p id={titleId} className="text-lg font-medium">
                            {isDragActive ? t('drop_zone').split(',')[0] : t('drop_zone')}
                        </p>
                        <p id={helperId} className="text-sm text-muted-foreground">
                            {t('supported_formats')}
                        </p>
                    </div>

                    <span
                        aria-hidden="true"
                        className="rounded-full bg-primary px-6 py-2 text-primary-foreground shadow-[0_18px_30px_-18px_hsl(var(--primary))] transition-colors hover:bg-primary/90"
                    >
                        {t('browse')}
                    </span>
                </div>
            </div>

            <div className="mt-6 space-y-5 text-center">
                <p className="flex items-center justify-center gap-2 text-[13px] leading-6 text-foreground/62">
                    <Lock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>{t('privacy_notice')}</span>
                </p>

                <div className="border-t border-border/60 pt-4">
                    <p className="mb-3 text-sm text-foreground/72">{t('try_demo')}</p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                        {DEMO_IMAGES.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => handleDemoClick(item.uploadSrc, item.id)}
                                className="group relative overflow-hidden rounded-[18px] border border-white/70 bg-background shadow-[0_18px_28px_-24px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_22px_36px_-24px_hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
                                type="button"
                                aria-label={`${t('demo_aria', { number: idx + 1 })} · ${locale === "zh" ? item.labelZh : item.labelEn}`}
                            >
                                <div className="relative aspect-[4/5]">
                                    <Image
                                        src={item.previewSrc}
                                        alt={`${t('demo_alt', { number: idx + 1 })} · ${locale === "zh" ? item.labelZh : item.labelEn}`}
                                        fill
                                        sizes="(max-width: 640px) 30vw, 96px"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6 text-[11px] font-semibold tracking-[0.02em] text-white">
                                    {locale === "zh" ? item.labelZh : item.labelEn}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>
                </div>
            )}
        </div>
    );
}
