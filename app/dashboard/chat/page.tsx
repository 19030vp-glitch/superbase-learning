import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createRoom } from "./actions";
import { Plus } from "lucide-react";

export default async function ChatListPage() {
    const supabase = await createClient();

    const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Chat Rooms</h1>
                <p className="text-muted-foreground">
                    Join a conversation or create your own room.
                </p>
            </div>

            <Card className="border-none shadow-sm bg-muted/40">
                <CardHeader>
                    <CardTitle className="text-xl">Create New Room</CardTitle>
                    <CardDescription>
                        Enter a name for your chat room to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createRoom} className="flex flex-col sm:flex-row gap-3">
                        <Input
                            name="name"
                            placeholder="e.g. Project Alpha, Coffee Break"
                            required
                            className="flex-1 bg-background"
                        />
                        <Button type="submit" className="sm:w-32">
                            <Plus className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rooms?.map((room) => (
                    <Link key={room.id} href={`/dashboard/chat/${room.id}`} className="group">
                        <Card className="h-full border shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                            <CardHeader>
                                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                    {room.name}
                                </CardTitle>
                                <CardDescription>
                                    Created {new Date(room.created_at).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Click to enter chat room
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {rooms?.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground">No chat rooms found. Create the first one!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
