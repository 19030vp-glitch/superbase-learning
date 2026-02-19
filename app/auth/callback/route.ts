import { NextResponse } from "next/server";
// The client you created in Step 2
import { createClient } from "@/utils/supabase/server";
import { getURL } from "@/utils/get-url";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in search params, use it as the redirection URL
    const next = searchParams.get("next") ?? "/";

    const origin = getURL();

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
