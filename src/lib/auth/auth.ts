import { AtpAgent } from '@atproto/api';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';

// Define a store for the agent, so it can be accessed throughout the app
// This is a simplified example, in a real app you might want to use a more robust state management solution
let agent: AtpAgent | null = null;

/**
 * Logs in a user with their AT Protocol handle, app password, and optional PDS URL.
 * @param identifier The user's handle (e.g., 'alice.bsky.social') or DID.
 * @param password The user's app password.
 * @param pdsUrl Optional. The URL of the Personal Data Server (PDS). Defaults to Bluesky's PDS.
 */
export async function login(identifier: string, password: string, pdsUrl?: string): Promise<void> {
    try {
        // Initialize the agent with the provided PDS URL or a default
        agent = new AtpAgent({
            service: pdsUrl || 'https://bsky.social',
        });

        // Attempt to login
        await agent.login({
            identifier: identifier,
            password: password,
        });

        // Store session details (e.g., in local storage or a more secure cookie)
        // For simplicity, we'll just rely on the agent holding the session for now
        // In a real application, you'd persist the session token securely.
        localStorage.setItem('atproto_session', JSON.stringify({ session: agent.session, pdsUrl: pdsUrl || 'https://bsky.social' }));

        // Redirect to the game page on successful login
        goto('/game');
    } catch (e: any) {
        console.error('Login failed:', e);
        // Clear any stored session on failure
        localStorage.removeItem('atproto_session');
        throw new Error(`Login failed: ${e.message || 'Unknown error'}`);
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
 * This function is crucial for maintaining a logged-in state without requiring re-authentication.
 * It attempts to refresh the session using the existing agent. If no agent or session exists,
 * it will attempt to load a session from local storage and then refresh it.
 * @returns A Promise that resolves when the session is refreshed, or rejects on failure.
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
        // Always pass the session object to resumeSession
        await agent.resumeSession(currentSession);
        localStorage.setItem('atproto_session', JSON.stringify({ session: agent.session, pdsUrl: pdsServiceUrl }));
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

// Re-initialize agent on page load if a session exists
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

// This ensures the agent is ready for use immediately
if (typeof window !== 'undefined' && localStorage.getItem('atproto_session')) {
    // Attempt to refresh session on startup. This will initialize the agent if needed.
    refreshSession().catch(e => console.error("Initial session refresh failed:", e));
}