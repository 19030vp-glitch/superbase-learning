import Link from "next/link";
import { resetPassword } from "@/app/auth/actions";
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

export default function ResetPasswordPage({
    searchParams,
}: {
    searchParams: { message: string; error: string };
}) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Set New Password</CardTitle>
                    <CardDescription>
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={resetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                            />
                        </div>

                        {searchParams?.error && (
                            <p className="text-sm text-destructive">
                                {searchParams.error}
                            </p>
                        )}
                        {searchParams?.message && (
                            <p className="text-sm text-green-600">
                                {searchParams.message}
                            </p>
                        )}

                        <Button type="submit" className="w-full">
                            Update Password
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        <Link href="/login" className="underline">
                            Back to sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
