import { goto } from '$app/navigation';
import { initiateATProtoLogin } from './oauth';
import { isATProtoLoggedIn, logoutATProto, getATProtoSession, refreshATProtoSession } from './session';
import type { ATProtoSession } from './session';
import { submitScore as submitATProtoScore } from './atproto';

/**
 * Handles the login process with AT Protocol
 * @param identifier The AT Protocol handle or DID (e.g., user.bsky.social or did:plc:...)
 * @returns A promise that resolves when login is initiated
 */
export async function login(identifier: string): Promise<void> {
    try {
        await initiateATProtoLogin(identifier);
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

/**
 * Handles the logout process.
 * Clears the AT Protocol session and redirects to the login page.
 */
export function logout(): void {
    logoutATProto();
}

/**
 * Checks if the user is currently logged in.
 * @returns True if the user is logged in, false otherwise.
 */
export function isLoggedIn(): boolean {
    return isATProtoLoggedIn();
}

/**
 * Gets the current user session
 * @returns The current AT Protocol session or null if not logged in
 */
export function getCurrentSession(): ATProtoSession | null {
    return getATProtoSession();
}

/**
 * Refreshes the current session tokens
 * @returns The refreshed session or null if refresh failed
 */
export async function refreshSession(): Promise<ATProtoSession | null> {
    return await refreshATProtoSession();
}

/**
 * Submits a user's score.
 * @param score The score to submit.
 * @returns A Promise that resolves when the score is successfully submitted.
 */
export async function submitScore(score: number): Promise<void> {
    return await submitATProtoScore(score);
}

/**
 * Gets the current user's display name (handle)
 * @returns The user's handle or null if not logged in
 */
export function getCurrentUserHandle(): string | null {
    const session = getCurrentSession();
    return session ? session.handle : null;
}