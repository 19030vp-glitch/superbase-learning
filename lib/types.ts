export interface Profile {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
}

export interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    room_id: string;
    profiles: Profile | null;
    reply_to?: string;
    reply_to_message?: {
        content: string;
        profiles: {
            full_name: string | null;
            username: string | null;
        } | null;
    } | null;
}


export interface ReplyTo {
    id: string;
    content: string;
    username: string;
}
