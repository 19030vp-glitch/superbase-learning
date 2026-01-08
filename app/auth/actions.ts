"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return redirect("/login?error=" + encodeURIComponent(error.message));
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const origin = (await (await import("next/headers")).headers()).get("origin");

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        return redirect("/signup?error=" + encodeURIComponent(error.message));
    }

    return redirect("/signup?message=Success! Please check your email for a confirmation link.");
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login");
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const origin = (await (await import("next/headers")).headers()).get("origin");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
        return redirect("/forgot-password?error=" + encodeURIComponent(error.message));
    }

    return redirect("/forgot-password?message=Password reset link sent to your email");
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
        return redirect("/reset-password?error=Passwords do not match");
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        return redirect("/reset-password?error=" + encodeURIComponent(error.message));
    }

    return redirect("/login?message=Password updated successfully");
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    const fullName = formData.get("fullName") as string;
    const username = formData.get("username") as string;
    const website = formData.get("website") as string;

    const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        username,
        website,
        updated_at: new Date().toISOString(),
    });

    if (error) {
        return redirect("/dashboard/profile?error=" + encodeURIComponent(error.message));
    }

    revalidatePath("/dashboard/profile");
    return redirect("/dashboard/profile?message=Profile updated successfully");
}

export async function signInWithGoogle() {
    const supabase = await createClient();
    const origin = (await (await import("next/headers")).headers()).get("origin");

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        return redirect("/login?error=" + encodeURIComponent(error.message));
    }

    if (data.url) {
        redirect(data.url);
    }
}

export async function signInWithGitHub() {
    const supabase = await createClient();
    const origin = (await (await import("next/headers")).headers()).get("origin");

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        return redirect("/login?error=" + encodeURIComponent(error.message));
    }

    if (data.url) {
        redirect(data.url);
    }
}
