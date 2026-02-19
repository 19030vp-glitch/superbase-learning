"use client";

import { useState } from "react";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { User } from "@supabase/supabase-js";
import { Message, ReplyTo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Info } from "lucide-react";
import Link from "next/link";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

interface ChatViewProps {
    roomId: string;
    initialMessages: Message[];
    roomName: string;
    roomCreatedAt: string;
    user: User;
    currentUserProfile?: {
        full_name: string | null;
        avatar_url: string | null;
        username: string | null;
    };
}

export function ChatView({
    roomId,
    initialMessages,
    roomName,
    roomCreatedAt,
    user,
    currentUserProfile,
}: ChatViewProps) {
    const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background/50 backdrop-blur-xl relative">
            {/* Professional Sticky Header */}
            <header className="flex flex-shrink-0 items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <Button variant="ghost" size="icon" asChild className="h-9 w-9 border md:hidden">
                        <Link href="/dashboard/chat">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-base font-bold truncate leading-tight">{roomName}</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live Chat
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2 md:flex hidden">
                                <Users className="h-4 w-4" />
                                <span>Members</span>
                            </Button>
                        </DrawerTrigger>
                        <DrawerTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9 md:hidden">
                                <Users className="h-4 w-4" />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-h-[80vh]">
                            <DrawerHeader className="text-left border-b pb-4">
                                <DrawerTitle>Room Information</DrawerTitle>
                                <DrawerDescription className="text-xs">
                                    Manage members and view room details for <span className="font-bold text-foreground">{roomName}</span>
                                </DrawerDescription>
                            </DrawerHeader>
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <ChatMessages
                                    roomId={roomId}
                                    initialMessages={initialMessages}
                                    currentUserId={user.id}
                                    currentUserProfile={currentUserProfile}
                                    onReply={setReplyTo}
                                    isSidebarOnly={true}
                                />
                            </div>
                            <DrawerFooter className="border-t pt-4">
                                <p className="text-[10px] text-center text-muted-foreground">
                                    Created on {new Date(roomCreatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </p>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                </div>
            </header>

            <div className="flex-1 min-h-0 flex flex-col relative">
                <ChatMessages
                    roomId={roomId}
                    initialMessages={initialMessages}
                    currentUserId={user.id}
                    currentUserProfile={currentUserProfile}
                    onReply={setReplyTo}
                />
            </div>

            <div className="flex-shrink-0">
                <ChatInput
                    roomId={roomId}
                    user={user}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                    onMessageSent={() => setReplyTo(null)}
                />
            </div>
        </div>
    );
}
