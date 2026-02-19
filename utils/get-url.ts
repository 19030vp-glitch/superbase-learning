export const getURL = () => {
    let url =
        process.env.NEXT_PUBLIC_SITE_URL ??
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel for client side
        process.env.VERCEL_URL ?? // Automatically set by Vercel for server side
        "http://localhost:3000";

    // Make sure to include `https://` when not localhost.
    url = url.includes("http") ? url : `https://${url}`;
    // Remove trailing slash if present to avoid double slashes when concatenating paths
    url = url.endsWith("/") ? url.slice(0, -1) : url;
    return url;
};
