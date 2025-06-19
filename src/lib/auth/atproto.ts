import { goto } from '$app/navigation';
import { browser } from '$app/environment';

interface Profile {
    avatar: string | null;
    banner: string | null;
    displayName: string | null;
    did: string;
    handle: string;
    description: string | null;
    pds: string;
}

async function safeFetch(url: string, fetcher: typeof globalThis.fetch) {
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

function getCache<T>(key: string): T | null {
    if (!browser) return null;
    const item = localStorage.getItem(key);
    if (item) {
        try {
            return JSON.parse(item) as T;
        } catch (e) {
            console.error("Error parsing cache for key", key, e);
            return null;
        }
    }
    return null;
}

function setCache<T>(key: string, value: T): void {
    if (!browser) return;
    localStorage.setItem(key, JSON.stringify(value));
}

export interface ATProtoSession {
    did: string;
    handle: string;
    accessJwt: string;
    refreshJwt: string;
    pdsUrl: string;
}

export interface PDSInfo {
    url: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    issuer: string;
}

/**
 * Discovers PDS information from a handle or DID
 */
export async function discoverPDS(identifier: string): Promise<PDSInfo> {
    const profile = await getProfile(identifier, fetch);
    const pdsUrl = profile.pds;

    // Discover OAuth endpoints
    const oauthConfig = await discoverOAuthEndpoints(pdsUrl);

    return {
        url: pdsUrl,
        authorizationEndpoint: oauthConfig.authorization_endpoint,
        tokenEndpoint: oauthConfig.token_endpoint,
        issuer: oauthConfig.issuer
    };
}

/**
 * Fetches the profile of a given identifier (handle or DID) and caches it.
 * @param identifier The AT Protocol handle or DID.
 * @param fetcher The fetch function to use for requests.
 * @returns A Promise that resolves to the user's Profile.
 */
export async function getProfile(identifier: string, fetcher: typeof globalThis.fetch): Promise<Profile> {
    const cacheKey = `profile_${identifier}`;
    let profile: Profile | null = getCache<Profile>(cacheKey);

    if (profile) {
        return profile;
    }

    try {
        const fetchProfile = await safeFetch(
            `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${identifier}`,
            fetcher
        );
        const split = fetchProfile["did"].split(":");
        let diddoc;
        if (split[0] === "did") {
            if (split[1] === "plc") {
                diddoc = await safeFetch(`https://plc.directory/${fetchProfile["did"]}`, fetcher);
            } else if (split[1] === "web") {
                diddoc = await safeFetch("https://" + split[2] + "/.well-known/did.json", fetcher);
            }
        } else {
            throw new Error("Invalid DID, malformed");
        }
        let pdsurl;
        for (const service of diddoc["service"]) {
            if (service["id"] === "#atproto_pds") {
                pdsurl = service["serviceEndpoint"];
            }
        }
        if (!pdsurl) {
            throw new Error("DID lacks #atproto_pds service");
        }
        profile = {
            avatar: fetchProfile["avatar"],
            banner: fetchProfile["banner"],
            displayName: fetchProfile["displayName"],
            did: fetchProfile["did"],
            handle: fetchProfile["handle"],
            description: fetchProfile["description"],
            pds: pdsurl,
        };
        setCache(cacheKey, profile);
        return profile;
    } catch (error: unknown) {
        console.error("Error fetching profile:", error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error("An unknown error occurred while fetching profile");
        }
    }
}



/**
 * Discovers OAuth configuration from PDS
 */
async function discoverOAuthEndpoints(pdsUrl: string) {
    const wellKnownUrl = `${pdsUrl}/.well-known/oauth-authorization-server`;
    const response = await fetch(wellKnownUrl);
    
    if (!response.ok) {
        throw new Error('Failed to discover OAuth endpoints');
    }
    
    return response.json();
}

/**
 * Generates a random string for PKCE challenge
 */
function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Creates SHA256 hash for PKCE challenge
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

/**
 * Base64 URL encode
 */
function base64urlencode(a: ArrayBuffer): string {
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(a))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Initiates AT Protocol OAuth login flow
 */
export async function initiateATProtoLogin(identifier: string): Promise<void> {
    if (!browser) return;
    
    try {
        // Discover PDS
        const profile = await getProfile(identifier, fetch);
        const pdsInfo = await discoverOAuthEndpoints(profile.pds);
        
        // Generate PKCE challenge
        const codeVerifier = generateRandomString(128);
        const codeChallenge = base64urlencode(await sha256(codeVerifier));
        
        // Generate state parameter
        const state = generateRandomString(32);
        
        // Store OAuth state in sessionStorage
        const oauthState = {
            codeVerifier,
            state,
            pdsInfo,
            identifier
        };
        sessionStorage.setItem('atproto_oauth_state', JSON.stringify(oauthState));
        
        // Build authorization URL
        const clientId = import.meta.env.PUBLIC_APP_URL || window.location.origin;
        const redirectUri = `${clientId}/auth/callback`;
        
        const authUrl = new URL(pdsInfo.authorizationEndpoint);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', 'atproto');
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('state', state);
        
        // Redirect to authorization endpoint
        window.location.href = authUrl.toString();
        
    } catch (error) {
        console.error('Failed to initiate AT Proto login:', error);
        throw error;
    }
}

/**
 * Handles the OAuth callback and exchanges code for tokens
 */
export async function handleOAuthCallback(code: string, state: string): Promise<ATProtoSession> {
    if (!browser) throw new Error('OAuth callback must be handled in browser');
    
    // Retrieve and validate OAuth state
    const storedStateJson = sessionStorage.getItem('atproto_oauth_state');
    if (!storedStateJson) {
        throw new Error('No OAuth state found');
    }
    
    const storedState = JSON.parse(storedStateJson);
    if (storedState.state !== state) {
        throw new Error('Invalid OAuth state');
    }
    
    // Exchange code for tokens
    const clientId = import.meta.env.PUBLIC_APP_URL || window.location.origin;
    const redirectUri = `${clientId}/auth/callback`;
    
    const tokenResponse = await fetch(storedState.pdsInfo.tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            code,
            redirect_uri: redirectUri,
            code_verifier: storedState.codeVerifier,
        }),
    });
    
    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user profile to extract DID and handle
    const profileResponse = await fetch(`${storedState.pdsInfo.url}/xrpc/com.atproto.server.getSession`, {
        // Use the PDS URL from the stored profile to ensure we're hitting the correct PDS
        // This is important because the PDS URL might be different from the one initially discovered
        // if the user's DID resolves to a different PDS after authentication.
        // The storedState.pdsInfo.url is the URL of the PDS that issued the tokens.
        // We need to ensure that the session is retrieved from the same PDS.
        // The profile.pds from getProfile is the authoritative PDS for the user's DID.
        // However, for session retrieval, we must use the PDS that issued the tokens.
        // So, we keep storedState.pdsInfo.url here.

        headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
        },
    });
    
    if (!profileResponse.ok) {
        throw new Error('Failed to get user profile');
    }
    
    const profile = await profileResponse.json();
    
    const session: ATProtoSession = {
        did: profile.did,
        handle: profile.handle,
        accessJwt: tokens.access_token,
        refreshJwt: tokens.refresh_token,
        pdsUrl: storedState.pdsInfo.url
    };
    
    // Store session in localStorage
    localStorage.setItem('atproto_session', JSON.stringify(session));
    
    // Clean up OAuth state
    sessionStorage.removeItem('atproto_oauth_state');
    
    return session;
}

/**
 * Gets the current AT Protocol session
 */
export function getATProtoSession(): ATProtoSession | null {
    if (!browser) return null;
    
    const sessionJson = localStorage.getItem('atproto_session');
    if (!sessionJson) return null;
    
    try {
        return JSON.parse(sessionJson);
    } catch {
        return null;
    }
}

/**
 * Checks if user is logged in with AT Protocol
 */
export function isATProtoLoggedIn(): boolean {
    return getATProtoSession() !== null;
}

/**
 * Logs out the current AT Protocol session
 */
export function logoutATProto(): void {
    if (!browser) return;
    
    localStorage.removeItem('atproto_session');
    sessionStorage.removeItem('atproto_oauth_state');
    
    goto('/login');
}

/**
 * Refreshes the AT Protocol session tokens
 */
export async function refreshATProtoSession(): Promise<ATProtoSession | null> {
    if (!browser) return null;
    
    const session = getATProtoSession();
    if (!session) return null;
    
    try {
        const response = await fetch(`${session.pdsUrl}/xrpc/com.atproto.server.refreshSession`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.refreshJwt}`,
            },
        });
        
        if (!response.ok) {
            // Refresh failed, clear session
            logoutATProto();
            return null;
        }
        
        const newTokens = await response.json();
        
        const updatedSession: ATProtoSession = {
            ...session,
            accessJwt: newTokens.accessJwt,
            refreshJwt: newTokens.refreshJwt
        };
        
        localStorage.setItem('atproto_session', JSON.stringify(updatedSession));
        return updatedSession;
        
    } catch (error) {
        console.error('Failed to refresh session:', error);
        logoutATProto();
        return null;
    }
}