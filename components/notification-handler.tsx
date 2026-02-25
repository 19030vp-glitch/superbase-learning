"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { Message } from "@/lib/types";


interface NotificationHandlerProps {
    currentUserId: string;
}

export function NotificationHandler({ currentUserId }: NotificationHandlerProps) {
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);
    const router = useRouter();
    const supabase = createClient();

    // Keep pathnameRef up to date
    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        // Request notification permission on mount
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Subscribe to all new messages
        const channel = supabase
            .channel("global-notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload: RealtimePostgresInsertPayload<Message>) => {
                    const newMessage = payload.new;


                    // Don't notify for our own messages
                    if (newMessage.user_id === currentUserId) return;

                    // Get current room ID from pathname if we are in a chat room
                    const match = pathnameRef.current.match(/\/dashboard\/chat\/([a-zA-Z0-9-]+)/);
                    const currentRoomId = match ? match[1] : null;

                    // Only notify if tab is hidden OR we are not in the room where the message was sent
                    const shouldNotify =
                        document.visibilityState === "hidden" ||
                        currentRoomId !== newMessage.room_id;

                    if (shouldNotify) {
                        try {
                            // Fetch sender profile and room name for better notification
                            const [{ data: profile }, { data: room }] = await Promise.all([
                                supabase
                                    .from("profiles")
                                    .select("full_name, username")
                                    .eq("id", newMessage.user_id)
                                    .single(),
                                supabase
                                    .from("rooms")
                                    .select("name")
                                    .eq("id", newMessage.room_id)
                                    .single(),
                            ]);

                            const senderName =
                                profile?.full_name || profile?.username || "Someone";
                            const roomName = room?.name || "a chat room";

                            // Handle message content (e.g. if it's a chart)
                            let body = newMessage.content;
                            try {
                                const parsed = JSON.parse(newMessage.content);
                                if (parsed.type === "chart") {
                                    body = "📊 sent a chart";
                                }
                            } catch {
                                // Not JSON, keep as is
                            }

                            if ("Notification" in window && Notification.permission === "granted") {
                                const notification = new Notification(`New message in ${roomName}`, {
                                    body: `${senderName}: ${body}`,
                                    icon: "/favicon.ico",
                                });

                                notification.onclick = () => {
                                    window.focus();
                                    router.push(`/dashboard/chat/${newMessage.room_id}`);
                                };
                            }
                        } catch (error) {
                            console.error("Error showing notification:", error);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, router, supabase]);

    return null;
}
