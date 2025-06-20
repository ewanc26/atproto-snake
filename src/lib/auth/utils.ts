import { browser } from '$app/environment';

export async function safeFetch(url: string, fetcher: typeof globalThis.fetch) {
    try {
        const response = await fetcher(url);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
        return await response.json();
    } catch (error: unknown) {
        console.error(`Network error fetching ${url}:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch ${url}: ${error.message}`);
        } else {
            throw new Error(`Failed to fetch ${url}: An unknown error occurred`);
        }
    }
}

export function getCache<T>(key: string): T | null {
    if (!browser) return null;
    const item = localStorage.getItem(key);
    if (item) {
        try {
            const parsed = JSON.parse(item);
            // Check if cached item has expiry and if it's still valid
            if (parsed.expiry && Date.now() > parsed.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return parsed.data || parsed;
        } catch (e) {
            console.error("Error parsing cache for key", key, e);
            localStorage.removeItem(key);
            return null;
        }
    }
    return null;
}

export function setCache<T>(key: string, value: T, ttlMs: number = 3600000): void { // 1 hour default TTL
    if (!browser) return;
    const cacheItem = {
        data: value,
        expiry: Date.now() + ttlMs
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
}

export function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

export function base64urlencode(a: ArrayBuffer): string {
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(a))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}