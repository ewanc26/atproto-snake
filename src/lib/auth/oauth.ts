import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { Profile, ATProtoSession, PDSInfo } from './types';
import { safeFetch, generateRandomString, sha256, base64urlencode } from './utils';
import { getProfile, getATProtoSession, setATProtoSession } from './atproto';

/**
 * Discovers OAuth configuration from PDS
 */
export async function discoverOAuthEndpoints(pdsUrl: string) {
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