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

export default async function ChatListPage() {
    const supabase = await createClient();

    const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Chat Rooms</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create a Room</CardTitle>
                    <CardDescription>
                        Start a new conversation by creating a room.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createRoom} className="flex gap-4">
                        <Input
                            name="name"
                            placeholder="Room Name (e.g., General, Project Alpha)"
                            required
                            className="max-w-sm"
                        />
                        <Button type="submit">Create Room</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rooms?.map((room) => (
                    <Link key={room.id} href={`/dashboard/chat/${room.id}`}>
                        <Card className="hover:bg-accent transition-colors cursor-pointer">
                            <CardHeader>
                                <CardTitle>{room.name}</CardTitle>
                                <CardDescription>
                                    Created on {new Date(room.created_at).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
                {rooms?.length === 0 && (
                    <p className="text-muted-foreground col-span-full text-center py-10">
                        No rooms found. Create one to get started!
                    </p>
                )}
            </div>
        </div>
    );
}
