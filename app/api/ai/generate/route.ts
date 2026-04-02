import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getProjectId } from "@/utils/supabase/project";
import { CREDITS_PER_GENERATION } from "@/config/credit-packs";
import type { AnimeStyleId } from "@/config/landing-pages";

// Required for Cloudflare Pages deployment
export const runtime = 'edge';
export const maxDuration = 60; // 1 minute timeout

// OpenRouter Nano Banana Model
const NANO_BANANA_MODEL = "google/gemini-2.5-flash-image";

type Intensity = "low" | "medium" | "high";

const PONY_PREFIX =
    "score_9, score_8_up, score_7_up, source_anime, masterpiece, best quality";
const PONY_NEGATIVE_PREFIX =
    "score_6, score_5, score_4, worst quality, low quality, 3d, realistic, photorealistic";

const STYLE_PRESETS: Record<
    AnimeStyleId,
    { prompt: string; negative: string; denoising: number }
> = {
    standard: {
        prompt:
            "anime artwork, 2d illustration, flat shading, high contrast, vibrant colors, clean lines, stunning visual, highly detailed face, official anime art",
        negative: "blurry, muddy colors, bad anatomy",
        denoising: 0.58,
    },
    ghibli: {
        prompt:
            "studio ghibli style, traditional animation, watercolor background, lush nature, soft lighting, spirited away style, flat colors, nostalgic vibe",
        negative: "cyberpunk, dark, neon, 3d render, modern digital art, sharp edges",
        denoising: 0.63,
    },
    cyberpunk: {
        prompt:
            "cyberpunk style, cyberpunk edgerunners, neon lights, glowing accents, night city, high tech, dramatic lighting, dark background, vivid colors",
        negative: "daytime, soft lighting, nature, watercolor, pale colors",
        denoising: 0.65,
    },
    retro_90s: {
        prompt:
            "1990s style, retro anime, vintage anime, classic anime, cel shading, vhs artifacts, soft pastel colors, old anime style, nostalgic",
        negative: "modern anime, high resolution, ultra sharp, glossy skin, 3d",
        denoising: 0.55,
    },
    webtoon: {
        prompt:
            "korean webtoon style, manhwa style, solo leveling style, sharp features, aesthetic, detailed eyes, glossy hair, modern web comic",
        negative: "chibi, cute, 90s style, thick lines",
        denoising: 0.52,
    },
    cosplay: {
        prompt:
            "anime redraw of a cosplay photo, preserve outfit identity and key colors, polished 2d illustration look, clean linework, official anime art, vibrant colors",
        negative: "photorealistic costume texture, messy linework, muddy colors, blurry",
        denoising: 0.56,
    },
};

function buildPrompt(opts: {
    style: AnimeStyleId;
    intensity: Intensity;
    keepEyeColor: boolean;
    keepHairColor: boolean;
    userPrompt?: string;
}) {
    const stylePreset = STYLE_PRESETS[opts.style] ?? STYLE_PRESETS.standard;
    const intensityLine =
        opts.intensity === "low"
            ? "Low anime intensity: keep more of the original facial structure and proportions."
            : opts.intensity === "high"
                ? "High anime intensity: strongly stylize into a clear 2D anime look while keeping identity recognizable."
                : "Medium anime intensity: balanced stylization with recognizable identity.";

    const keepLines: string[] = [];
    if (opts.keepEyeColor) keepLines.push("Try to preserve the original eye color.");
    if (opts.keepHairColor) keepLines.push("Try to preserve the original hair color.");

    const userLine = opts.userPrompt?.trim() ? `Extra notes: ${opts.userPrompt.trim()}` : "";

    return [
        "Task: Transform the provided photo into anime-style artwork.",
        "Output: One single image, no text, no watermark.",
        `Base quality tags: ${PONY_PREFIX}.`,
        `Style preset: ${stylePreset.prompt}.`,
        intensityLine,
        ...keepLines,
        userLine,
        `Negative prompt: ${PONY_NEGATIVE_PREFIX}, ${stylePreset.negative}, text, watermark, logo, caption, signature.`,
    ]
        .filter(Boolean)
        .join("\n");
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const projectId = await getProjectId(supabase);

    try {
        const body = await request.json();
        const image: string | undefined = body?.image;
        const style: AnimeStyleId = (body?.style as AnimeStyleId) || "standard";
        const intensity: Intensity = (body?.intensity as Intensity) || "medium";
        const keepEyeColor: boolean = body?.keepEyeColor !== false;
        const keepHairColor: boolean = body?.keepHairColor !== false;
        const prompt: string | undefined = body?.prompt;
        const stylePreset = STYLE_PRESETS[style] ?? STYLE_PRESETS.standard;

        // 1. Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Please sign in to generate.", code: "UNAUTHORIZED" }, { status: 401 });
        }

        // 2. Input Validation
        if (!image) {
            return NextResponse.json({ error: "Missing image", code: "MISSING_IMAGE" }, { status: 400 });
        }

        if (!process.env.OPENROUTER_API_KEY) {
            console.error("OPENROUTER_API_KEY is not set");
            return NextResponse.json({ error: "Service configuration error", code: "CONFIG_ERROR" }, { status: 500 });
        }

        // 3. Deduct Credits
        const { data: deductSuccess, error: rpcError } = await supabase.rpc('decrease_credits', {
            p_user_id: user.id,
            p_amount: CREDITS_PER_GENERATION,
            p_description: `AI Generation (${style})`
        });

        if (rpcError) {
            console.error("RPC Error:", rpcError);
            return NextResponse.json({ error: "System busy, please try again", code: "SYSTEM_ERROR" }, { status: 500 });
        }

        if (!deductSuccess) {
            return NextResponse.json({
                error: "Insufficient credits",
                code: "INSUFFICIENT_CREDITS",
                required: CREDITS_PER_GENERATION
            }, { status: 402 });
        }

        // 4. Call OpenRouter Nano Banana API
        try {
            const finalPrompt = buildPrompt({
                style,
                intensity,
                keepEyeColor,
                keepHairColor,
                userPrompt: prompt,
            });

            console.log("=== Calling OpenRouter Nano Banana ===");
            console.log("Model:", NANO_BANANA_MODEL);
            console.log("Style:", style);
            console.log("Prompt:", finalPrompt);

            // Prepare image data - ensure it's in the correct format
            let imageData = image;
            let mimeType = "image/png";

            // Handle base64 data URL format
            if (image.startsWith('data:')) {
                const matches = image.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                    mimeType = matches[1];
                    imageData = image; // Keep full data URL for OpenRouter
                }
            } else {
                // If it's raw base64, add the data URL prefix
                imageData = `data:image/png;base64,${image}`;
            }

            // Call OpenRouter API
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
                    "X-Title": "Photo to Anime AI"
                },
                body: JSON.stringify({
                    model: NANO_BANANA_MODEL,
                    response_modalities: ["image", "text"],
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: finalPrompt
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: imageData
                                    }
                                }
                            ]
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("OpenRouter API Error:", response.status, errorText);
                throw new Error(`OpenRouter API failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log("OpenRouter Response structure:", JSON.stringify({
                hasChoices: !!result.choices,
                messageKeys: result.choices?.[0]?.message ? Object.keys(result.choices[0].message) : [],
                contentType: typeof result.choices?.[0]?.message?.content,
                hasImages: !!result.choices?.[0]?.message?.images
            }, null, 2));

            // Extract the generated image from the response
            let resultImageUrl: string | null = null;

            const message = result.choices?.[0]?.message;
            if (message) {
                // Check for images array (OpenRouter Nano Banana format)
                if (message.images && Array.isArray(message.images) && message.images.length > 0) {
                    const img = message.images[0];
                    if (img.type === "image_url" && img.image_url?.url) {
                        resultImageUrl = img.image_url.url;
                    }
                }

                // Fallback: check content if it's an array
                if (!resultImageUrl && Array.isArray(message.content)) {
                    for (const part of message.content) {
                        if (part.type === "image_url" && part.image_url?.url) {
                            resultImageUrl = part.image_url.url;
                            break;
                        }
                        if (part.type === "image" && part.data) {
                            resultImageUrl = `data:image/png;base64,${part.data}`;
                            break;
                        }
                    }
                }
            }

            if (!resultImageUrl) {
                console.error("Failed to extract image from response:", JSON.stringify(result, null, 2));
                throw new Error("Nano Banana returned no image");
            }

            console.log("Generated image URL/data length:", resultImageUrl.substring(0, 100) + "...");

            // 5. Log Generation
            await supabase.from("generations").insert({
                project_id: projectId,
                user_id: user.id,
                prompt: finalPrompt,
                model_id: "nano-banana",
                image_url: resultImageUrl.startsWith("data:") ? "base64_image" : resultImageUrl,
                input_image_url: "user_upload",
                status: "succeeded",
                credits_cost: CREDITS_PER_GENERATION,
                metadata: {
                    style,
                    intensity,
                    keepEyeColor,
                    keepHairColor,
                    model: NANO_BANANA_MODEL,
                    stylePrompt: stylePreset.prompt,
                    styleNegativePrompt: `${PONY_NEGATIVE_PREFIX}, ${stylePreset.negative}`,
                    denoisingStrength: stylePreset.denoising,
                    promptFramework: "pony-style-preset-matrix",
                }
            });

            return NextResponse.json({ url: resultImageUrl, success: true });

        } catch (aiError: any) {
            console.error("AI Service Error:", aiError);
            console.error("AI Error Details:", JSON.stringify({
                message: aiError?.message,
                status: aiError?.status,
                response: aiError?.response,
                name: aiError?.name
            }, null, 2));

            // Refund credits on failure
            await supabase.rpc('decrease_credits', {
                p_user_id: user.id,
                p_amount: -CREDITS_PER_GENERATION,
                p_description: 'Refund: AI Generation Failed'
            });

            return NextResponse.json({
                error: "Generation failed. Credits refunded.",
                code: "AI_FAILED",
                refunded: true,
                details: aiError?.message || "Unknown error"
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Route Error:", error);
        return NextResponse.json(
            { error: error.message || "Server error", code: "UNKNOWN_ERROR" },
            { status: 500 }
        );
    }
}
