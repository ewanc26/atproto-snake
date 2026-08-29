<script lang="ts">
	// Login route — offers both OAuth (recommended) and app-password
	// authentication. Redirects to /game if a session already exists.
	import { login, loginWithOAuth, initAuth, getAuthType } from '$lib/auth/auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let tab = $state<'oauth' | 'password'>('oauth');
	let identifier = $state('');
	let oauthHandle = $state('');
	let password = $state('');
	let errorMessage = $state('');
	let isLoading = $state(false);

	onMount(async () => {
		const agent = await initAuth();
		if (agent) {
			goto('/game');
		}
	});

	// OAuth login
	async function handleOAuthLogin(): Promise<void> {
		if (!oauthHandle.trim()) {
			errorMessage = 'Please enter your AT Protocol handle.';
			return;
		}

		errorMessage = '';
		isLoading = true;

		try {
			await loginWithOAuth(oauthHandle.trim());
			// Never reached - redirects away
		} catch (error) {
			console.error('OAuth error:', error);
			errorMessage = error instanceof Error ? error.message : 'OAuth sign-in failed.';
			isLoading = false;
		}
	}

	// App password login
	async function handlePasswordLogin(): Promise<void> {
		if (!identifier.trim() || !password.trim()) {
			errorMessage = 'Please enter your AT Protocol handle and app password.';
			return;
		}

		errorMessage = '';
		isLoading = true;

		try {
			await login(identifier.trim(), password.trim());
		} catch (error) {
			console.error('Login error:', error);
			errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
			isLoading = false;
		}
	}

	function handleInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			if (tab === 'oauth') {
				handleOAuthLogin();
			} else {
				handlePasswordLogin();
			}
		}
	}
</script>

<div class="bg-canvas-950 text-ink-900 flex min-h-screen flex-col justify-center">
	<div class="flex flex-1 items-center justify-center px-4 py-8 pb-20">
		<div class="w-full max-w-md">
			<!-- Header Section -->
			<div class="mb-8 text-center">
				<h1
					class="text-ink-950 mb-3 inline-flex items-center gap-2 text-4xl font-extrabold sm:text-5xl"
				>
					Sign in
					<span class="bg-gold-500 h-2.5 w-2.5 rounded-full" aria-hidden="true"></span>
				</h1>
				<p class="text-ink-700 text-lg">Use your AT Protocol account to play</p>
			</div>

			<!-- Login Form -->
			<div class="border-canvas-line bg-canvas-800 rounded-lg border p-8">
				<!-- Tabs -->
				<div class="bg-canvas-900 mb-6 flex gap-1 rounded-full p-1">
					<button
						class="flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors {tab ===
						'oauth'
							? 'bg-gold-500 text-canvas-950'
							: 'text-ink-500 hover:text-ink-900'}"
						onclick={() => {
							tab = 'oauth';
							errorMessage = '';
						}}
					>
						OAuth <span class="text-xs opacity-75">Recommended</span>
					</button>
					<button
						class="flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors {tab ===
						'password'
							? 'bg-gold-500 text-canvas-950'
							: 'text-ink-500 hover:text-ink-900'}"
						onclick={() => {
							tab = 'password';
							errorMessage = '';
						}}
					>
						App Password
					</button>
				</div>

				{#if tab === 'oauth'}
					<!-- OAuth Form -->
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleOAuthLogin();
						}}
						class="space-y-6"
					>
						<div>
							<label for="oauthHandle" class="text-ink-700 mb-2 block text-sm font-medium">
								AT Protocol Handle
							</label>
							<input
								type="text"
								id="oauthHandle"
								bind:value={oauthHandle}
								onkeydown={handleInputKeydown}
								placeholder="alice.bsky.social"
								class="border-canvas-line bg-canvas-900 text-ink-950 placeholder-ink-500 focus:border-gold-500 focus:ring-gold-500/20 w-full rounded-md border p-4 transition-colors duration-200 focus:ring-2 focus:outline-none"
								disabled={isLoading}
								required
							/>
							<p class="text-ink-500 mt-2 text-xs">
								Sign in securely through your PDS — no password is ever shared with us.
							</p>
						</div>

						{#if errorMessage}
							<div class="border-ember-500/40 bg-ember-500/10 rounded-md border p-4">
								<p class="text-ember-400 text-sm">{errorMessage}</p>
							</div>
						{/if}

						<button
							type="submit"
							disabled={isLoading || !oauthHandle}
							class="bg-gold-500 text-canvas-950 hover:bg-gold-400 disabled:bg-canvas-700 disabled:text-ink-500 flex w-full items-center justify-center space-x-2 rounded-md px-6 py-4 font-bold transition-colors duration-200 disabled:cursor-not-allowed"
						>
							{#if isLoading}
								<div class="border-canvas-950 h-5 w-5 animate-spin rounded-full border-b-2"></div>
								<span>Redirecting…</span>
							{:else}
								<span>Continue with ATProto →</span>
							{/if}
						</button>

						<p class="text-ink-500 text-center text-xs">
							You'll be sent to your PDS to approve access, then returned here automatically.
						</p>
					</form>
				{:else}
					<!-- App Password Form -->
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handlePasswordLogin();
						}}
						class="space-y-6"
					>
						<div>
							<label for="identifier" class="text-ink-700 mb-2 block text-sm font-medium">
								AT Protocol Handle
							</label>
							<input
								type="text"
								id="identifier"
								bind:value={identifier}
								onkeydown={handleInputKeydown}
								placeholder="alice.bsky.social"
								class="border-canvas-line bg-canvas-900 text-ink-950 placeholder-ink-500 focus:border-gold-500 focus:ring-gold-500/20 w-full rounded-md border p-4 transition-colors duration-200 focus:ring-2 focus:outline-none"
								disabled={isLoading}
								required
							/>
						</div>

						<div>
							<label for="password" class="text-ink-700 mb-2 block text-sm font-medium">
								App Password
							</label>
							<input
								type="password"
								id="password"
								bind:value={password}
								onkeydown={handleInputKeydown}
								placeholder="Your app password"
								class="border-canvas-line bg-canvas-900 text-ink-950 placeholder-ink-500 focus:border-gold-500 focus:ring-gold-500/20 w-full rounded-md border p-4 transition-colors duration-200 focus:ring-2 focus:outline-none"
								disabled={isLoading}
								required
							/>
							<p class="text-ink-500 mt-2 text-xs">
								Generate this in your Bluesky app settings or AT Protocol client.
							</p>
						</div>

						{#if errorMessage}
							<div class="border-ember-500/40 bg-ember-500/10 rounded-md border p-4">
								<p class="text-ember-400 text-sm">{errorMessage}</p>
							</div>
						{/if}

						<button
							type="submit"
							disabled={isLoading || !identifier || !password}
							class="bg-gold-500 text-canvas-950 hover:bg-gold-400 disabled:bg-canvas-700 disabled:text-ink-500 flex w-full items-center justify-center space-x-2 rounded-md px-6 py-4 font-bold transition-colors duration-200 disabled:cursor-not-allowed"
						>
							{#if isLoading}
								<div class="border-canvas-950 h-5 w-5 animate-spin rounded-full border-b-2"></div>
								<span>Connecting…</span>
							{:else}
								<span>Sign In with App Password</span>
							{/if}
						</button>
					</form>
				{/if}

				<!-- Sign Up Link -->
				<div class="mt-6 text-center">
					<p class="text-ink-500 text-sm">
						Don't have an account?
						<a
							href="https://bsky.app"
							target="_blank"
							rel="noopener noreferrer"
							class="text-gold-400 hover:text-gold-300 underline transition-colors duration-200"
						>
							Sign up on Bluesky
						</a>
					</p>
				</div>
			</div>

			<!-- Info Section -->
			<div class="mt-8 text-center">
				<details class="group text-ink-500 text-sm">
					<summary
						class="hover:text-ink-900 mb-4 inline-flex cursor-pointer items-center space-x-2 transition-colors duration-200"
					>
						<svg
							class="h-4 w-4 transform transition-transform duration-200 group-open:rotate-90"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>How does this work?</span>
					</summary>
					<div class="border-canvas-line bg-canvas-800 space-y-3 rounded-md border p-6">
						<div class="flex items-start space-x-3">
							<svg
								class="text-gold-400 mt-0.5 h-5 w-5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<div class="text-left">
								<p class="text-ink-700 font-medium">OAuth (Recommended)</p>
								<p class="text-ink-500 text-xs">
									Sign in through your PDS with granular permissions. We only request access to
									write game scores.
								</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<svg
								class="text-ember-400 mt-0.5 h-5 w-5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							<div class="text-left">
								<p class="text-ink-700 font-medium">App Password</p>
								<p class="text-ink-500 text-xs">
									Use an app password for authentication. Note: this grants broader access than
									OAuth.
								</p>
							</div>
						</div>
					</div>
				</details>
			</div>
		</div>
	</div>
</div>
