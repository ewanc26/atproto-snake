/**
 * ATProto OAuth client — browser-based authentication.
 * Uses granular scope for writing snake scores only.
 */

import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';

const SCOPE = 'atproto repo:uk.ewancroft.snake.score';

// Dev uses loopback, production uses hosted metadata
const CLIENT_ID = import.meta.env.DEV
	? `http://localhost?${new URLSearchParams([
			['redirect_uri', 'http://127.0.0.1:5173/'],
			['scope', SCOPE]
		])}`
	: 'https://snake.ewancroft.uk/client-metadata.json';

let _client: Promise<BrowserOAuthClient> | null = null;

function getClient(): Promise<BrowserOAuthClient> {
	if (!_client) {
		_client = BrowserOAuthClient.load({
			clientId: CLIENT_ID,
			handleResolver: 'https://bsky.social'
		});
	}
	return _client;
}

/**
 * Initialise OAuth — call on page mount.
 * Processes any OAuth callback params and restores stored sessions.
 */
export async function initOAuth(): Promise<Agent | null> {
	const client = await getClient();
	const result = await client.init();
	if (!result) return null;
	return new Agent(result.session);
}

/**
 * Sign in with OAuth — redirects away, never returns normally.
 */
export async function signInWithOAuth(handle: string): Promise<never> {
	const client = await getClient();
	await client.signIn(handle, { scope: SCOPE });
	throw new Error('redirect should have occurred');
}
