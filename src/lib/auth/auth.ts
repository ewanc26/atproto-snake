import { AtpAgent } from '@atproto/api';
import { goto } from '$app/navigation';

// Define a store for the agent, so it can be accessed throughout the app
let agent: AtpAgent | null = null;

interface ResolvedIdentity {
    did: string;
    handle: string;
    pds: string;
    signing_key: string;
}

/**
 * Resolves an AT Protocol identifier (handle or DID) to get PDS information
 * @param identifier The user's handle (e.g., 'alice.bsky.social') or DID
 * @returns Promise containing the resolved identity information
 */
async function resolveIdentifier(identifier: string): Promise<ResolvedIdentity> {
    const response = await fetch(
        `https://slingshot.microcosm.blue/xrpc/com.bad-example.identity.resolveMiniDoc?identifier=${encodeURIComponent(identifier)}`
    );
    
    if (!response.ok) {
        throw new Error(`Failed to resolve identifier: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.did || !data.pds) {
        throw new Error('Invalid response from identity resolver');
    }
    
    return data;
}

/**
 * Logs in a user with their AT Protocol handle/DID and app password.
 * Automatically resolves the PDS URL using Slingshot.
 * @param identifier The user's handle (e.g., 'alice.bsky.social') or DID.
 * @param password The user's app password.
 */
export async function login(identifier: string, password: string): Promise<void> {
    try {
        // Resolve the identifier to get PDS and other info
        const resolved = await resolveIdentifier(identifier);
        
        // Initialize the agent with the resolved PDS URL
        agent = new AtpAgent({
            service: resolved.pds,
        });

        // Attempt to login using the resolved DID or original identifier
        await agent.login({
            identifier: resolved.did, // Use DID for more reliable authentication
            password: password,
        });

        // Store session details with resolved information
        localStorage.setItem('atproto_session', JSON.stringify({ 
            session: agent.session, 
            pdsUrl: resolved.pds,
            resolvedData: resolved
        }));

        // Redirect to the game page on successful login
        goto('/game');
    } catch (e: any) {
        console.error('Login failed:', e);
        // Clear any stored session on failure
        localStorage.removeItem('atproto_session');
        
        // Provide more specific error messages
        if (e.message.includes('Failed to resolve identifier')) {
            throw new Error('Handle not found. Please check your AT Protocol handle.');
        } else if (e.message.includes('AuthFactorTokenRequired')) {
            throw new Error('Two-factor authentication required. Please use your app password.');
        } else if (e.message.includes('AccountTakedown') || e.message.includes('AccountSuspended')) {
            throw new Error('Account is suspended or has been taken down.');
        } else if (e.message.includes('InvalidCredentials')) {
            throw new Error('Invalid credentials. Please check your handle and app password.');
        } else {
            throw new Error(`Login failed: ${e.message || 'Unknown error'}`);
        }
    }
}

/**
 * Checks if a user is currently logged in.
 * @returns True if a session exists, false otherwise.
 */
export function isLoggedIn(): boolean {
    // Check if an agent exists and has an active session
    if (agent?.session) {
        return true;
    }
    // Check if a session is stored in local storage
    const session = localStorage.getItem('atproto_session');
    return !!session;
}

/**
 * Refreshes the current user session.
 */
export async function refreshSession(): Promise<void> {
    let currentSession = agent?.session;
    let pdsServiceUrl: string | undefined;

    // If no active agent session, try to load from local storage
    if (!currentSession) {
        const storedData = localStorage.getItem('atproto_session');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                currentSession = parsedData.session;
                pdsServiceUrl = parsedData.pdsUrl;
            } catch (e) {
                console.error('Failed to parse stored session:', e);
                localStorage.removeItem('atproto_session');
                throw new Error('Invalid stored session. Please log in again.');
            }
        }
    } else if (agent?.service) {
        pdsServiceUrl = agent.service.toString();
    }

    if (!currentSession || !pdsServiceUrl) {
        throw new Error('No session or PDS URL found to refresh.');
    }

    // Ensure agent is initialized with the current PDS
    if (!agent || agent.service.toString() !== pdsServiceUrl) {
        agent = new AtpAgent({
            service: pdsServiceUrl,
        });
    }

    try {
        await agent.resumeSession(currentSession);
        
        // Update stored session
        const storedData = localStorage.getItem('atproto_session');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            localStorage.setItem('atproto_session', JSON.stringify({ 
                ...parsedData,
                session: agent.session 
            }));
        }
    } catch (e) {
        console.error('Failed to refresh session:', e);
        localStorage.removeItem('atproto_session');
        throw new Error('Session refresh failed. Please log in again.');
    }
}

/**
 * Logs out the current user by clearing the session.
 */
export function logout(): void {
    agent = null;
    localStorage.removeItem('atproto_session');
    goto('/login');
}

/**
 * Gets the current user's handle.
 * @returns The user's handle if logged in, otherwise null.
 */
export function getCurrentUserHandle(): string | null {
    return agent?.session?.handle || null;
}

/**
 * Gets the current user's DID.
 * @returns The user's DID if logged in, otherwise null.
 */
export function getCurrentUserDid(): string | null {
    return agent?.session?.did || null;
}

/**
 * Gets the resolved identity data for the current user.
 * @returns The resolved identity data if available, otherwise null.
 */
export function getCurrentUserResolvedData(): ResolvedIdentity | null {
    const storedData = localStorage.getItem('atproto_session');
    if (storedData) {
        try {
            const parsedData = JSON.parse(storedData);
            return parsedData.resolvedData || null;
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * Fetches the profile of a given user handle.
 * @param handle The user's handle (e.g., 'alice.bsky.social').
 * @returns The user's profile object, or null if not found or an error occurs.
 */
export async function getProfile(handle: string): Promise<any | null> {
    if (!agent) {
        try {
            await refreshSession();
        } catch (e) {
            console.error("Agent not initialized and session refresh failed:", e);
            return null;
        }
    }

    if (!agent) {
        console.error("Agent is still not initialized after refresh attempt.");
        return null;
    }

    try {
        const response = await agent.getProfile({ actor: handle });
        return response.data;
    } catch (e) {
        console.error(`Failed to fetch profile for ${handle}:`, e);
        return null;
    }
}

/**
 * Submits the user's score to the AT Protocol.
 * @param score The score to submit.
 */
export async function submitScore(score: number): Promise<void> {
    if (!agent || !agent.session) {
        throw new Error('Not logged in. Cannot submit score.');
    }

    try {
        await agent.com.atproto.repo.createRecord({
            repo: agent.session.did,
            collection: 'uk.ewancroft.snake.score',
            record: {
                $type: 'uk.ewancroft.snake.score',
                score: score,
                createdAt: new Date().toISOString(),
            },
        });
        console.log('Score submitted successfully!');
    } catch (e) {
        console.error('Failed to submit score:', e);
        throw new Error(`Failed to submit score: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}

// Initialize agent on page load if a session exists
if (typeof window !== 'undefined' && localStorage.getItem('atproto_session')) {
    refreshSession().catch(e => console.error("Initial session refresh failed:", e));
}