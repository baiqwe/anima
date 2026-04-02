"use server";

import { encodedRedirect } from "@/utils/utils";
import { getLocalePath, normalizeLocale } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { getAppKey } from "@/utils/supabase/project";
import { headers } from "next/headers";
import { getRequestOrigin } from "@/utils/request";
import { redirect } from "next/navigation";

function resolveActionLocale(formData?: FormData) {
  const localeFromForm = formData?.get("locale")?.toString();
  if (localeFromForm === "en" || localeFromForm === "zh") {
    return localeFromForm;
  }

  return "en";
}

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const locale = resolveActionLocale(formData);
  const supabase = await createClient();
  const origin = await getRequestOrigin();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
      locale
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        app_key: getAppKey(),
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message, locale);
  } else {
    return encodedRedirect("success", "/dashboard", "Thanks for signing up!", locale);
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const locale = resolveActionLocale(formData);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message, locale);
  }

  return redirect(getLocalePath("/dashboard", locale));
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const locale = resolveActionLocale(formData);
  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required", locale);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=${encodeURIComponent(getLocalePath("/dashboard/reset-password", locale))}`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
      locale
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
    locale
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const locale = resolveActionLocale(formData);

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required",
      locale
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
      locale
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
      locale
    );
  }

  return encodedRedirect("success", "/dashboard/reset-password", "Password updated", locale);
};

export const signOutAction = async () => {
  const headerList = await headers();
  const referer = headerList.get("referer");
  const localeMatch = referer?.match(/\/(en|zh)(?:\/|$)/);
  const locale = normalizeLocale(localeMatch?.[1]);
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect(getLocalePath("/sign-in", locale));
};

export async function createCheckoutSession(
  productId: string,
  email: string,
  userId: string,
  productType: "subscription" | "credits",
  credits_amount?: number,
  discountCode?: string
) {
  try {
    const requestBody: any = {
      product_id: productId,
      // request_id: `${userId}-${Date.now()}`, // use Unique request ID if you need
      customer: {
        email: email,
      },
      metadata: {
        user_id: userId,
        product_type: productType,
        credits: credits_amount || 0,
        app_key: getAppKey(),
      },
    };

    // 如果配置了成功重定向 URL，则添加到请求中
    if (process.env.CREEM_SUCCESS_URL) {
      requestBody.success_url = process.env.CREEM_SUCCESS_URL;
    }

    // 添加折扣码（如果有）
    if (discountCode) {
      requestBody.discount_code = discountCode;
    }

    const response = await fetch(process.env.CREEM_API_URL + "/v1/checkouts", {
      method: "POST",
      headers: {
        "x-api-key": process.env.CREEM_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    const data = await response.json();
    return data.checkout_url;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}
