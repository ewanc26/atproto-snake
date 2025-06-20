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

function setCache<T>(key: string, value: T, ttlMs: number = 3600000): void { // 1 hour default TTL
    if (!browser) return;
    const cacheItem = {
        data: value,
        expiry: Date.now() + ttlMs
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
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
        console.log('Using cached profile for:', identifier);
        return profile;
    }

    try {
        console.log(`Fetching profile for identifier: ${identifier}`);
        
        const fetchProfile = await safeFetch(
            `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${identifier}`,
            fetcher
        );
        
        const did = fetchProfile["did"];
        if (!did) {
            throw new Error("Profile missing DID");
        }
        
        console.log(`Got DID: ${did}`);
        
        // Parse DID and fetch DID document
        const split = did.split(":");
        if (split.length < 3 || split[0] !== "did") {
            throw new Error(`Invalid DID format: ${did}`);
        }
        
        let diddoc;
        const didMethod = split[1];
        
        if (didMethod === "plc") {
            console.log(`Fetching PLC DID document for: ${did}`);
            diddoc = await safeFetch(`https://plc.directory/${did}`, fetcher);
        } else if (didMethod === "web") {
            const domain = split[2];
            console.log(`Fetching Web DID document for domain: ${domain}`);
            diddoc = await safeFetch(`https://${domain}/.well-known/did.json`, fetcher);
        } else {
            throw new Error(`Unsupported DID method: ${didMethod}`);
        }
        
        if (!diddoc) {
            throw new Error("Failed to fetch DID document");
        }
        
        console.log("DID document fetched:", JSON.stringify(diddoc, null, 2));
        
        if (!diddoc.service || !Array.isArray(diddoc.service)) {
            throw new Error("DID document missing or invalid service array");
        }
        
        // Look for AT Protocol PDS service - enhanced service detection
        let pdsurl: string | undefined;
        
        // Try multiple service detection approaches
        for (const service of diddoc.service) {
            console.log(`Checking service:`, service);
            
            // Check for various service ID formats and types
            const isAtProtoPDS = 
                service.id === "#atproto_pds" || 
                service.id === "atproto_pds" ||
                service.id === "#atproto" ||
                service.type === "AtprotoPersonalDataServer" ||
                (service.type === "PersonalDataServer" && service.id?.includes("atproto"));
            
            if (isAtProtoPDS) {
                let endpoint = service.serviceEndpoint;
                
                // Handle different serviceEndpoint formats
                if (typeof endpoint === 'string') {
                    pdsurl = endpoint;
                } else if (Array.isArray(endpoint) && endpoint.length > 0) {
                    pdsurl = typeof endpoint[0] === 'string' ? endpoint[0] : endpoint[0]?.uri;
                } else if (endpoint && typeof endpoint === 'object' && endpoint.uri) {
                    pdsurl = endpoint.uri;
                }
                
                if (pdsurl) {
                    console.log(`Found PDS URL: ${pdsurl} from service:`, service);
                    break;
                }
            }
        }
        
        // Fallback: look for any service that might be a PDS
        if (!pdsurl) {
            console.log("Primary PDS detection failed, trying fallback methods...");
            
            // Try to find any service with a reasonable endpoint
            for (const service of diddoc.service) {
                if (service.serviceEndpoint && typeof service.serviceEndpoint === 'string') {
                    // Check if it looks like a PDS URL (contains common PDS hostnames)
                    const endpoint = service.serviceEndpoint;
                    if (endpoint.includes('bsky.social') || 
                        endpoint.includes('pds') || 
                        endpoint.includes('atproto') ||
                        (endpoint.startsWith('https://') && !endpoint.includes('did:web'))) {
                        pdsurl = endpoint;
                        console.log(`Using fallback PDS URL: ${pdsurl} from service:`, service);
                        break;
                    }
                }
            }
        }
        
        // Final fallback for common cases
        if (!pdsurl && identifier.endsWith('.bsky.social')) {
            pdsurl = 'https://bsky.social';
            console.log('Using default bsky.social PDS for bsky.social handle');
        }
        
        if (!pdsurl) {
            console.error("No PDS URL found. Available services:", 
                diddoc.service.map((s: any) => ({ 
                    id: s.id, 
                    type: s.type, 
                    serviceEndpoint: s.serviceEndpoint 
                }))
            );
            throw new Error("Could not determine PDS URL from DID document. No AT Protocol PDS service found.");
        }
        
        // Clean and validate PDS URL
        pdsurl = pdsurl.replace(/\/$/, ''); // Remove trailing slash
        
        // Validate PDS URL format
        try {
            const url = new URL(pdsurl);
            if (!url.protocol.startsWith('http')) {
                throw new Error('PDS URL must use HTTP or HTTPS');
            }
        } catch (urlError) {
            throw new Error(`Invalid PDS URL format: ${pdsurl}`);
        }
        
        profile = {
            avatar: fetchProfile.avatar || null,
            banner: fetchProfile.banner || null,
            displayName: fetchProfile.displayName || null,
            did: did,
            handle: fetchProfile.handle,
            description: fetchProfile.description || null,
            pds: pdsurl,
        };
        
        console.log("Created profile:", profile);
        
        // Cache for 1 hour
        setCache(cacheKey, profile, 3600000);
        return profile;
        
    } catch (error: unknown) {
        // Clear any bad cache
        localStorage.removeItem(cacheKey);
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
    if (!pdsUrl) {
        throw new Error('PDS URL is required');
    }
    
    // Ensure pdsUrl doesn't have trailing slash
    const cleanPdsUrl = pdsUrl.replace(/\/$/, '');
    const wellKnownUrl = `${cleanPdsUrl}/.well-known/oauth-authorization-server`;
    
    console.log('Discovering OAuth endpoints at:', wellKnownUrl);
    
    try {
        const response = await fetch(wellKnownUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            // Add timeout
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`Failed to discover OAuth endpoints: ${response.status} ${response.statusText}`);
        }
        
        const config = await response.json();
        
        // Validate required OAuth endpoints
        if (!config.authorization_endpoint || !config.token_endpoint) {
            throw new Error('OAuth configuration missing required endpoints');
        }
        
        console.log('Successfully discovered OAuth endpoints:', config);
        return config;
        
    } catch (error) {
        console.error('OAuth discovery failed:', error);
        
        // If OAuth discovery fails, try some fallbacks for common PDS instances
        if (pdsUrl.includes('bsky.social')) {
            console.log('Attempting fallback OAuth config for bsky.social');
            return {
                authorization_endpoint: `${cleanPdsUrl}/oauth/authorize`,
                token_endpoint: `${cleanPdsUrl}/oauth/token`,
                issuer: cleanPdsUrl
            };
        }
        
        throw error;
    }
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
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(a))))
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
        console.log('Starting AT Proto login for:', identifier);

        // Clear any cached profile first to ensure fresh data
        const cacheKey = `profile_${identifier}`;
        localStorage.removeItem(cacheKey);

        // Discover PDS and get profile
        const profile = await getProfile(identifier, fetch);
        console.log('Got profile:', profile);

        if (!profile.pds) {
            throw new Error('Profile missing PDS URL');
        }

        // Discover OAuth endpoints
        const oauthConfig = await discoverOAuthEndpoints(profile.pds);
        console.log('Got OAuth config:', oauthConfig);

        // Generate PKCE challenge
        const codeVerifier = generateRandomString(128);
        const codeChallenge = base64urlencode(await sha256(codeVerifier));

        // Generate state parameter
        const state = generateRandomString(32);

        // Store OAuth state in sessionStorage
        const oauthState = {
            codeVerifier,
            state,
            pdsInfo: {
                url: profile.pds,
                authorizationEndpoint: oauthConfig.authorization_endpoint,
                tokenEndpoint: oauthConfig.token_endpoint,
                issuer: oauthConfig.issuer
            },
            identifier
        };
        sessionStorage.setItem('atproto_oauth_state', JSON.stringify(oauthState));

        // Correct clientId and redirectUri setup
        const canonicalClientId = "https://snake.ewancroft.uk/client-metadata.json";
        const origin = window.location.origin;
        const redirectUri = `${origin}/auth/callback`;

        // Build authorization URL
        const authUrl = new URL(oauthConfig.authorization_endpoint);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', canonicalClientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', 'atproto'); // scope as string, not array
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('state', state);

        console.log('Redirecting to:', authUrl.toString());

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
    
    // Clean up OAuth state immediately to prevent reuse
    sessionStorage.removeItem('atproto_oauth_state');

    if (storedState.state !== state) {
        throw new Error('Invalid OAuth state');
    }
    
    // Exchange code for tokens
    const canonicalClientId = "https://snake.ewancroft.uk/client-metadata.json";
    const redirectUri = "https://snake.ewancroft.uk/auth/callback";
    
    const requestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: canonicalClientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: storedState.codeVerifier,
    });

    console.log('Attempting token exchange with:', {
        tokenEndpoint: storedState.pdsInfo.tokenEndpoint,
        code,
        state,
        codeVerifier: storedState.codeVerifier,
        redirectUri,
        canonicalClientId,
        requestBody: requestBody.toString()
    });

    const tokenResponse = await fetch(storedState.pdsInfo.tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
    });
    
    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user profile to extract DID and handle
    const profileResponse = await fetch(`${storedState.pdsInfo.url}/xrpc/com.atproto.server.getSession`, {
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
/**
 * Submits a user's score to the AT Protocol.
 * @param score The score to submit.
 * @returns A Promise that resolves when the score is successfully submitted.
 */
export async function submitScore(score: number): Promise<void> {
    if (!browser) throw new Error('Score submission must be handled in browser');

    const session = getATProtoSession();
    if (!session) {
        throw new Error('Not logged in. Cannot submit score.');
    }

    try {
        const response = await fetch(`${session.pdsUrl}/xrpc/com.atproto.repo.createRecord`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessJwt}`,
            },
            body: JSON.stringify({
                repo: session.did,
                collection: 'uk.ewancroft.snake.score',
                rkey: Date.now().toString(), // Unique record key
                record: {
                    score: score,
                    createdAt: new Date().toISOString(),
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to submit score: ${response.status} - ${errorText}`);
        }

        console.log('Score submitted successfully:', score);
    } catch (error) {
        console.error('Error submitting score:', error);
        throw error;
    }
}

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