import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@/utils/supabase/server";
import { getProjectId } from "@/utils/supabase/project";
import { CREDITS_PER_GENERATION } from "@/config/credit-packs";
import type { AnimeStyleId } from "@/config/landing-pages";

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute timeout

// Replicate official Nano Banana Pro image editing model.
// Verified input schema uses `prompt` + `image_input[]`.
const REPLICATE_MODEL =
    "google/nano-banana-pro:d71e2df08d6ef4c4fb6d3773e9e557de6312e04444940dbb81fd73366ed83941";

type Intensity = "low" | "medium" | "high";

const STYLE_PRESETS: Record<AnimeStyleId, { prompt: string }> = {
    standard: {
        prompt:
            "high-quality modern anime portrait, polished 2D illustration, clean linework, expressive eyes, balanced flat shading, crisp facial rendering, vibrant but natural color palette",
    },
    ghibli: {
        prompt:
            "warm hand-drawn animation inspired by classic Japanese fantasy films, soft watercolor backgrounds, gentle natural lighting, painterly textures, nostalgic atmosphere, simplified facial rendering, storybook charm",
    },
    cyberpunk: {
        prompt:
            "anime portrait in a futuristic cyberpunk world, neon rim lighting, glowing accents, electric signage, high-contrast shadows, saturated magenta and cyan palette, sleek techwear mood, dramatic night-city atmosphere",
    },
    retro_90s: {
        prompt:
            "retro 1990s anime cel look, classic hand-painted cel shading, softened linework, faded pastel palette, VHS-era texture, slightly muted contrast, old-school television anime mood, nostalgic character design",
    },
    webtoon: {
        prompt:
            "clean Korean webtoon illustration, sleek manhwa aesthetics, sharp facial structure, controlled gradients, glossy hair rendering, precise contour lines, elegant modern character styling, vertical-comic polish",
    },
    cosplay: {
        prompt:
            "anime redraw of a cosplay photo, preserve costume identity, preserve signature outfit colors and accessories, polished 2D illustration finish, clean linework, expressive anime rendering, convention-poster quality",
    },
};

function buildPromptParts(opts: {
    style: AnimeStyleId;
    intensity: Intensity;
    keepEyeColor: boolean;
    keepHairColor: boolean;
    userPrompt?: string;
}) {
    const stylePreset = STYLE_PRESETS[opts.style] ?? STYLE_PRESETS.standard;
    const intensityInstruction =
        opts.intensity === "low"
            ? "Use light anime stylization. Keep the person's recognizable facial structure, hairstyle silhouette, pose, and framing close to the original photo."
            : opts.intensity === "high"
                ? "Use strong anime stylization. Push the image confidently toward the target style with more illustrated features, clearer shape design, and a more transformed 2D look while still keeping the same person recognizable."
                : "Use balanced anime stylization. Keep the same person recognizable while clearly shifting the image into the target illustrated style.";

    const keepInstructions: string[] = [];
    if (opts.keepEyeColor) keepInstructions.push("Keep the original eye color if visible in the source image.");
    if (opts.keepHairColor) keepInstructions.push("Keep the original hair color as the dominant hair color.");

    const userInstruction = opts.userPrompt?.trim()
        ? `Also incorporate this extra request if it does not conflict with the target style: ${opts.userPrompt.trim()}`
        : "";

    return {
        positive: [
            "Transform the uploaded portrait into anime-style artwork.",
            "Keep the same person and overall identity from the source image.",
            "Do not create a generic anime face. Preserve the person's distinct face shape, age impression, expression, and key facial traits.",
            `Target visual direction: ${stylePreset.prompt}.`,
            intensityInstruction,
            ...keepInstructions,
            "Avoid photorealistic skin texture, 3D rendering, generic stock-anime features, and unnecessary background distractions.",
            "Render one clean final image with no text, no watermark, and no extra people unless explicitly requested.",
            userInstruction,
        ]
            .filter(Boolean)
            .join(" "),
    };
}

function normalizeImageInput(image: string) {
    if (image.startsWith("blob:")) {
        throw new Error("Temporary browser image URLs are not supported. Please re-upload the image.");
    }

    if (image.startsWith("data:")) {
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
            throw new Error("Invalid image data URL");
        }

        return {
            buffer: Buffer.from(matches[2], "base64"),
            mimeType: matches[1] || "image/png",
        };
    }

    if (/^https?:\/\//.test(image)) {
        return image;
    }

    return {
        buffer: Buffer.from(image, "base64"),
        mimeType: "image/png",
    };
}

function extractReplicateOutputUrl(output: unknown) {
    if (typeof output === "string") {
        return output;
    }

    if (Array.isArray(output) && output.length > 0) {
        const first = output[0];
        if (typeof first === "string") {
            return first;
        }
        if (first && typeof first === "object" && typeof (first as { url?: () => URL }).url === "function") {
            return (first as { url: () => URL }).url().toString();
        }
        if (first && typeof first === "object" && typeof (first as { toString?: () => string }).toString === "function") {
            return (first as { toString: () => string }).toString();
        }
    }

    if (output && typeof output === "object" && typeof (output as { url?: () => URL }).url === "function") {
        return (output as { url: () => URL }).url().toString();
    }

    return null;
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

        if (!process.env.REPLICATE_API_TOKEN) {
            console.error("REPLICATE_API_TOKEN is not set");
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

        // 4. Call Replicate img2img API
        try {
            const { positive } = buildPromptParts({
                style,
                intensity,
                keepEyeColor,
                keepHairColor,
                userPrompt: prompt,
            });

            console.log("=== Calling Replicate Nano Banana Pro ===");
            console.log("Model:", REPLICATE_MODEL);
            console.log("Style:", style);
            console.log("Prompt:", positive);

            const replicate = new Replicate({
                auth: process.env.REPLICATE_API_TOKEN,
                fileEncodingStrategy: "data-uri",
            });

            const normalizedImage = normalizeImageInput(image);
            const replicateImage =
                typeof normalizedImage === "string"
                    ? normalizedImage
                    : (
                        await replicate.files.create(
                            new Blob([normalizedImage.buffer], { type: normalizedImage.mimeType })
                        )
                    ).urls.get;
            console.log("Replicate uploaded image:", replicateImage);

            const predictionResponse = await fetch("https://api.replicate.com/v1/predictions", {
                method: "POST",
                headers: {
                    Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
                    "Content-Type": "application/json",
                    Prefer: "wait=60",
                },
                body: JSON.stringify({
                    version: REPLICATE_MODEL.split(":")[1],
                    input: {
                        image_input: [replicateImage],
                        prompt: positive,
                        aspect_ratio: "match_input_image",
                        resolution: "2K",
                        output_format: "jpg",
                        safety_filter_level: "block_only_high",
                    },
                }),
            });

            if (!predictionResponse.ok) {
                const predictionErrorText = await predictionResponse.text();
                console.error("Replicate prediction error:", predictionResponse.status, predictionErrorText);
                throw new Error(
                    `Replicate prediction failed: ${predictionResponse.status} - ${predictionErrorText}`
                );
            }

            const prediction = await predictionResponse.json();
            const output = prediction.output;

            const resultImageUrl = extractReplicateOutputUrl(output);

            if (!resultImageUrl) {
                console.error("Failed to extract image from Replicate output:", output);
                throw new Error("Replicate returned no image");
            }

            console.log("Generated image URL/data length:", resultImageUrl.substring(0, 100) + "...");

            // 5. Log Generation
            await supabase.from("generations").insert({
                project_id: projectId,
                user_id: user.id,
                prompt: positive,
                model_id: "replicate-nano-banana-pro",
                image_url: resultImageUrl,
                input_image_url: image.startsWith("http") ? image : "user_upload",
                status: "succeeded",
                credits_cost: CREDITS_PER_GENERATION,
                metadata: {
                    style,
                    intensity,
                    keepEyeColor,
                    keepHairColor,
                    model: REPLICATE_MODEL,
                    stylePrompt: stylePreset.prompt,
                    promptFramework: "nano-banana-style-matrix",
                    provider: "replicate",
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
