import Link from "next/link";
import { forgotPassword } from "@/app/auth/actions";
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

export default function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: { message: string; error: string };
}) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive a password reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={forgotPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
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
                            Send Reset Link
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Remember your password?{" "}
                        <Link href="/login" className="underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
