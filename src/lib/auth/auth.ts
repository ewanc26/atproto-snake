// ── AT Protocol Authentication ──────────────────────────────
// Provides login (OAuth and app-password), session management,
// and score submission against the uk.ewancroft.snake.score
// lexicon. Authentication flows through Slingshot identity
// resolution or direct PDS browser OAuth.

import { asAtIdentifierString, Client } from '@atproto/lex';
import { PasswordSession } from '@atproto/lex-password-session';
import { app } from '@bsky/sdk/lexicons';
import { com } from '@bsky/sdk/lexicons';
import { goto } from '$app/navigation';
import { initOAuth, signInWithOAuth } from './oauth';

let client: Client | null = null;
let passwordSession: PasswordSession | null = null;
let currentDid: string | null = null;
let currentHandle: string | null = null;

let authType: 'oauth' | 'password' | null = null;

interface ResolvedIdentity {
	did: string;
	handle: string;
	pds: string;
	signing_key: string;
}

// ─── Identity Resolution ────────────────────────────────

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

// ─── Initialisation ─────────────────────────────────────

export async function initAuth(): Promise<Client | null> {
	try {
		const oauthClient = await initOAuth();
		if (oauthClient) {
			client = oauthClient;
			currentDid = oauthClient.did ?? null;
			try {
				if (!currentDid) throw new Error('OAuth session did not expose an account DID.');
				const profile = await oauthClient.call(app.bsky.actor.getProfile, {
					actor: asAtIdentifierString(currentDid)
				});
				currentHandle = profile.handle;
			} catch {
				currentHandle = currentDid;
			}
			authType = 'oauth';
			return oauthClient;
		}
	} catch (e) {
		console.log('OAuth init failed, checking for app password session:', e);
	}

	const storedData = localStorage.getItem('atproto_session');
	if (storedData) {
		try {
			const parsedData = JSON.parse(storedData);
			if (parsedData.session && parsedData.pdsUrl) {
				const session = await PasswordSession.resume(parsedData.session, {
					onUpdated: (saved) => {
						localStorage.setItem(
							'atproto_session',
							JSON.stringify({
								session: saved,
								pdsUrl: parsedData.pdsUrl,
								resolvedData: parsedData.resolvedData
							})
						);
					},
					onDeleted: () => {
						localStorage.removeItem('atproto_session');
					}
				});
				passwordSession = session;
				client = new Client(session);
				currentDid = session.did;
				currentHandle = session.handle;
				authType = 'password';
				return client;
			}
		} catch (e) {
			console.error('Failed to restore app password session:', e);
			localStorage.removeItem('atproto_session');
		}
	}

	return null;
}

// ─── Login ──────────────────────────────────────────────

export async function loginWithOAuth(handle: string): Promise<never> {
	return signInWithOAuth(handle);
}

export async function login(identifier: string, password: string): Promise<void> {
	try {
		const resolved = await resolveIdentifier(identifier);

		const session = await PasswordSession.login({
			service: resolved.pds,
			identifier: resolved.did || identifier,
			password,
			onUpdated: (saved) => {
				localStorage.setItem(
					'atproto_session',
					JSON.stringify({ session: saved, pdsUrl: resolved.pds, resolvedData: resolved })
				);
			},
			onDeleted: () => localStorage.removeItem('atproto_session')
		});

		passwordSession = session;
		client = new Client(session);
		currentDid = session.did;
		currentHandle = session.handle;

		localStorage.setItem(
			'atproto_session',
			JSON.stringify({
				session: session.session,
				pdsUrl: resolved.pds,
				resolvedData: resolved
			})
		);
		authType = 'password';

		goto('/game');
	} catch (e: any) {
		console.error('Login failed:', e);
		localStorage.removeItem('atproto_session');

		if (e.message?.includes('Failed to resolve identifier')) {
			throw new Error('Handle not found. Please check your AT Protocol handle.');
		} else if (e.message?.includes('AuthFactorTokenRequired')) {
			throw new Error('Two-factor authentication required. Please use your app password.');
		} else if (e.message?.includes('AccountTakedown') || e.message?.includes('AccountSuspended')) {
			throw new Error('Account is suspended or has been taken down.');
		} else if (e.message?.includes('InvalidCredentials')) {
			throw new Error('Invalid credentials. Please check your handle and app password.');
		} else {
			throw new Error(`Login failed: ${e.message || 'Unknown error'}`);
		}
	}
}

// ─── Session Management ─────────────────────────────────

export function isLoggedIn(): boolean {
	if (client) {
		return true;
	}
	const session = localStorage.getItem('atproto_session');
	return !!session;
}

export function getAuthType(): 'oauth' | 'password' | null {
	return authType;
}

export async function refreshSession(): Promise<void> {
	try {
		if (!client) await initAuth();
		if (!client) throw new Error('No session found.');
		if (passwordSession) await passwordSession.refresh();
	} catch (e) {
		console.error('Failed to refresh session:', e);
		localStorage.removeItem('atproto_session');
		throw new Error('Session refresh failed. Please log in again.');
	}
}

export function logout(): void {
	client = null;
	passwordSession = null;
	currentDid = null;
	currentHandle = null;
	authType = null;
	localStorage.removeItem('atproto_session');
	goto('/login');
}

export function getCurrentUserHandle(): string | null {
	return currentHandle;
}

export function getCurrentUserDid(): string | null {
	return currentDid;
}

export function getCurrentUserResolvedData(): ResolvedIdentity | null {
	const storedData = localStorage.getItem('atproto_session');
	if (storedData) {
		try {
			const parsedData = JSON.parse(storedData);
			return parsedData.resolvedData || null;
		} catch {
			return null;
		}
	}
	return null;
}

// ─── Profile & Score ───────────────────────────────────

export async function getProfile(handle: string): Promise<any | null> {
	if (!client) {
		try {
			await refreshSession();
		} catch (e) {
			console.error('Agent not initialized and session refresh failed:', e);
			return null;
		}
	}

	if (!client) {
		console.error('Client is still not initialized after refresh attempt.');
		return null;
	}

	try {
		return await client.call(app.bsky.actor.getProfile, {
			actor: asAtIdentifierString(handle)
		});
	} catch (e) {
		console.error(`Failed to fetch profile for ${handle}:`, e);
		return null;
	}
}

export async function submitScore(score: number): Promise<void> {
	if (!client || !currentDid) {
		throw new Error('Not logged in. Cannot submit score.');
	}

	try {
		await client.call(com.atproto.repo.createRecord, {
			repo: asAtIdentifierString(currentDid),
			collection: 'uk.ewancroft.snake.score',
			record: {
				$type: 'uk.ewancroft.snake.score',
				score: score,
				createdAt: new Date().toISOString()
			}
		});
		console.log('Score submitted successfully!');
	} catch (e) {
		console.error('Failed to submit score:', e);
		throw new Error(`Failed to submit score: ${e instanceof Error ? e.message : 'Unknown error'}`);
	}
}

export function getAgent(): Client | null {
	return client;
}
