"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRoom(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    const { data, error } = await supabase
        .from("rooms")
        .insert({
            name,
            created_by: user.id,
        })
        .select()
        .single();

    if (error) {
        return redirect("/dashboard/chat?error=" + encodeURIComponent(error.message));
    }

    revalidatePath("/dashboard/chat");
    return redirect(`/dashboard/chat/${data.id}`);
}

export async function sendMessage(roomId: string, content: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        user_id: user.id,
        content,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}
