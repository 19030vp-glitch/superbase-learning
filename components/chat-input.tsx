"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage } from "@/app/dashboard/chat/actions";
import { SendHorizontal, X, Reply, Mic, Square, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { EmojiPicker } from "@/components/emoji-picker";
import { GifPicker } from "@/components/gif-picker";
import { User } from "@supabase/supabase-js";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { ReplyTo } from "@/lib/types";
import { toast } from "sonner";

interface ChatInputProps {
    roomId: string;
    user: User;
    replyTo?: ReplyTo | null;
    onCancelReply?: () => void;
    onMessageSent?: () => void;
}

export function ChatInput({
    roomId,
    user,
    replyTo,
    onCancelReply,
    onMessageSent
}: ChatInputProps) {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        isRecording: isActuallyRecording,
        duration: actualDuration,
        audioBlob,
        startRecording,
        stopRecording,
        cancelRecording
    } = useAudioRecorder();

    const isRecording = isActuallyRecording;

    useEffect(() => {
        if (replyTo) {
            inputRef.current?.focus();
        }
    }, [replyTo]);

    const handleVoiceUpload = useCallback(async (blob: Blob) => {
        setIsLoading(true);
        const fileName = `${user.id}-${Date.now()}.webm`;

        try {
            const { error } = await supabase.storage
                .from("voice-messages")
                .upload(fileName, blob);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from("voice-messages")
                .getPublicUrl(fileName);

            const voiceMessageContent = JSON.stringify({
                type: "audio",
                url: publicUrl,
            });

            const result = await sendMessage(roomId, voiceMessageContent, replyTo?.id);

            if (result.success) {
                onMessageSent?.();
            } else {
                toast.error("Failed to send voice message");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            console.error("Error uploading voice message:", error);
            toast.error("Error uploading voice message: " + message);
        } finally {
            setIsLoading(false);
        }
    }, [user.id, supabase.storage, roomId, replyTo?.id, onMessageSent]);

    useEffect(() => {
        if (audioBlob) {
            handleVoiceUpload(audioBlob);
        }
    }, [audioBlob, handleVoiceUpload]);

    const handleGifSelect = async (url: string) => {
        setIsLoading(true);
        const gifMessageContent = JSON.stringify({
            type: "gif",
            url: url,
        });

        const result = await sendMessage(roomId, gifMessageContent, replyTo?.id);
        setIsLoading(false);

        if (result.success) {
            onMessageSent?.();
        } else {
            toast.error("Failed to send GIF");
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isLoading) return;

        // Stop typing indicator when sending
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            sendTypingStatus(false);
        }

        setIsLoading(true);
        const result = await sendMessage(roomId, content, replyTo?.id);
        setIsLoading(false);

        if (result.success) {
            setContent("");
            onMessageSent?.();
        }
    };

    const sendTypingStatus = async (isTyping: boolean) => {
        const channel = supabase.channel(`room:${roomId}`);
        await channel.send({
            type: "broadcast",
            event: "typing",
            payload: {
                isTyping,
                userId: user.id,
                userName: user.user_metadata?.full_name || user.email || "Someone"
            },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);

        if (!typingTimeoutRef.current) {
            sendTypingStatus(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(false);
            typingTimeoutRef.current = null;
        }, 3000);
    };

    return (
        <form onSubmit={handleSend} className="p-4 bg-transparent sticky bottom-0 z-10">
            <div className="max-w-4xl mx-auto flex flex-col bg-background/60 backdrop-blur-2xl border border-border/50 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300">
                {replyTo && (
                    <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border-b border-border/50 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-primary/10 p-2 rounded-full backdrop-blur-md">
                                <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                    Replying to {replyTo.username}
                                </span>
                                <span className="text-xs text-muted-foreground truncate italic opacity-80 decoration-primary/20">
                                    &quot;{replyTo.content}&quot;
                                </span>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors shrink-0"
                            onClick={onCancelReply}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-2 p-2 md:p-3">
                    {!isRecording ? (
                        <>
                            <div className="hidden md:flex items-center">
                                <EmojiPicker
                                    onChange={(emoji) => setContent((prev) => prev + emoji)}
                                />
                                <GifPicker onSelect={handleGifSelect} />
                            </div>
                            <div className="flex-1 relative flex items-center">
                                <Input
                                    ref={inputRef}
                                    value={content}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={replyTo ? "Type your response..." : "Transmit a message..."}
                                    disabled={isLoading}
                                    className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 md:h-12 text-sm md:text-base px-3 md:px-4 placeholder:text-muted-foreground/50 transition-all font-medium"
                                />
                                <div className="md:hidden flex items-center">
                                    <EmojiPicker
                                        onChange={(emoji) => setContent((prev) => prev + emoji)}
                                    />
                                    <GifPicker onSelect={handleGifSelect} />
                                </div>
                            </div>
                            {content.trim() ? (
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    size="icon"
                                    className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform shrink-0"
                                >
                                    <SendHorizontal className="w-5 h-5" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all h-10 w-10 md:h-12 md:w-12 rounded-full shrink-0 group"
                                    onClick={startRecording}
                                >
                                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </Button>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center gap-3 bg-red-500/5 rounded-full px-4 py-2 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                <div className="relative h-2 w-2">
                                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                                    <div className="relative rounded-full h-2 w-2 bg-red-500" />
                                </div>
                                <span className="text-xs md:text-sm font-bold tabular-nums text-red-500/80">
                                    {Math.floor(actualDuration / 60)}:{(actualDuration % 60).toString().padStart(2, "0")}
                                </span>
                                <div className="h-4 w-[1px] bg-red-500/20" />
                                <span className="text-[10px] md:text-xs font-bold text-red-500/60 uppercase tracking-widest truncate animate-pulse">
                                    Recording Voice Transmission...
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 md:h-9 md:w-9 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                                    onClick={cancelRecording}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="default"
                                    size="icon"
                                    className="h-10 w-10 md:h-11 md:w-11 rounded-full shadow-lg hover:scale-105 transition-transform bg-red-500 text-white hover:bg-red-600"
                                    onClick={stopRecording}
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
