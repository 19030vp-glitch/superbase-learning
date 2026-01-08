import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function ConfirmPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Email Confirmed!</CardTitle>
                    <CardDescription>
                        Your email has been successfully verified
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-6 text-sm text-muted-foreground">
                        You can now sign in to your account and start using the app.
                    </p>
                    <Button asChild className="w-full">
                        <Link href="/login">Continue to Sign In</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
