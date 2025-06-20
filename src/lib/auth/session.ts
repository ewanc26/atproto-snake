import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { ATProtoSession } from './types';
export type { ATProtoSession };

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
 * Sets the current AT Protocol session
 */
export function setATProtoSession(session: ATProtoSession): void {
    if (!browser) return;
    localStorage.setItem('atproto_session', JSON.stringify(session));
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