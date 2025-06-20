import { browser } from '$app/environment';
import type { Profile, PDSInfo } from './types';
import { safeFetch, getCache, setCache } from './utils';
import { discoverOAuthEndpoints } from './oauth';
import { getATProtoSession } from './session';

export { initiateATProtoLogin, handleOAuthCallback } from './oauth';
export { isATProtoLoggedIn, logoutATProto, refreshATProtoSession, getATProtoSession, setATProtoSession } from './session';


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