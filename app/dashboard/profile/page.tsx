import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/auth/actions";

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: { message: string; error: string };
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground">
                    Update your public profile and account details.
                </p>
            </div>

            <Card className="border-none shadow-sm bg-muted/20">
                <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>
                        Manage your personal information.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateProfile} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-muted-foreground">Email (Publicly visible)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user.email}
                                disabled
                                className="bg-muted text-muted-foreground border-dashed"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                type="text"
                                defaultValue={profile?.full_name || ""}
                                placeholder="How do you want to be called?"
                                className="bg-background"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                defaultValue={profile?.username || ""}
                                placeholder="Unique username"
                                className="bg-background"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                name="website"
                                type="url"
                                defaultValue={profile?.website || ""}
                                placeholder="https://yourpage.com"
                                className="bg-background"
                            />
                        </div>

                        {searchParams?.error && (
                            <p className="text-sm font-medium text-destructive">
                                {searchParams.error}
                            </p>
                        )}
                        {searchParams?.message && (
                            <p className="text-sm font-medium text-green-600">
                                {searchParams.message}
                            </p>
                        )}

                        <Button type="submit" className="w-[120px]">Save Changes</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
