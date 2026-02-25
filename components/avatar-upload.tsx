"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    userId: string;
    name?: string | null;
}

export function AvatarUpload({ currentAvatarUrl, userId, name }: AvatarUploadProps) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const getInitials = () => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2);
        }
        return userId.substring(0, 2).toUpperCase();
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `avatar-${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
            toast.success("Avatar uploaded successfully!");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error uploading avatar!";
            toast.error(message);
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const removeAvatar = () => {
        setAvatarUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-border shadow-sm">
                    <AvatarImage src={avatarUrl || ""} alt="Profile" className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {getInitials()}
                    </AvatarFallback>
                </Avatar>
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full backdrop-blur-[2px]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}
                {avatarUrl && !uploading && (
                    <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        title="Remove photo"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {avatarUrl ? "Change Photo" : "Upload Photo"}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                />
            </div>

            <input type="hidden" name="avatarUrl" value={avatarUrl || ""} />
        </div>
    );
}
