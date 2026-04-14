<script lang="ts">
	import { login, loginWithOAuth, initAuth, getAuthType } from '$lib/auth/auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let tab = $state<'oauth' | 'password'>('oauth');
	let identifier = '';
	let oauthHandle = '';
	let password = '';
	let errorMessage = '';
	let isLoading = false;

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

<div
	class="flex min-h-screen flex-col justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
>
	<div class="flex flex-1 items-center justify-center px-4 py-8 pb-20">
		<div class="w-full max-w-md">
			<!-- Header Section -->
			<div class="mb-8 text-center">
				<div class="mb-6">
					<h1
						class="mb-4 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl"
					>
						Snake Game
					</h1>
					<p class="text-lg text-gray-300">Sign in with your AT Protocol account</p>
				</div>
			</div>

			<!-- Login Form -->
			<div
				class="rounded-2xl border border-gray-700/50 bg-gray-800/80 p-8 shadow-2xl backdrop-blur-sm"
			>
				<!-- Tabs -->
				<div class="mb-6 flex gap-2">
					<button
						class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all {tab === 'oauth'
							? 'bg-green-600 text-white'
							: 'bg-gray-700/50 text-gray-400 hover:text-gray-200'}"
						onclick={() => {
							tab = 'oauth';
							errorMessage = '';
						}}
					>
						OAuth <span class="text-xs opacity-75">Recommended</span>
					</button>
					<button
						class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all {tab ===
						'password'
							? 'bg-green-600 text-white'
							: 'bg-gray-700/50 text-gray-400 hover:text-gray-200'}"
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
					<form on:submit|preventDefault={handleOAuthLogin} class="space-y-6">
						<div>
							<label for="oauthHandle" class="mb-2 block text-sm font-medium text-gray-300">
								AT Protocol Handle
							</label>
							<input
								type="text"
								id="oauthHandle"
								bind:value={oauthHandle}
								on:keydown={handleInputKeydown}
								placeholder="alice.bsky.social"
								class="w-full rounded-xl border border-gray-600/50 bg-gray-700/50 p-4 text-white placeholder-gray-400 transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
								disabled={isLoading}
								required
							/>
							<p class="mt-2 text-xs text-gray-400">
								Sign in securely through your PDS — no password is ever shared with us.
							</p>
						</div>

						{#if errorMessage}
							<div class="rounded-xl border border-red-700/50 bg-red-900/50 p-4 backdrop-blur-sm">
								<p class="text-sm text-red-200">{errorMessage}</p>
							</div>
						{/if}

						<button
							type="submit"
							disabled={isLoading || !oauthHandle}
							class="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-green-700 hover:to-green-800 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
						>
							{#if isLoading}
								<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
								<span>Redirecting...</span>
							{:else}
								<span>Continue with ATProto →</span>
							{/if}
						</button>

						<p class="text-center text-xs text-gray-400">
							You'll be sent to your PDS to approve access, then returned here automatically.
						</p>
					</form>
				{:else}
					<!-- App Password Form -->
					<form on:submit|preventDefault={handlePasswordLogin} class="space-y-6">
						<div>
							<label for="identifier" class="mb-2 block text-sm font-medium text-gray-300">
								AT Protocol Handle
							</label>
							<input
								type="text"
								id="identifier"
								bind:value={identifier}
								on:keydown={handleInputKeydown}
								placeholder="alice.bsky.social"
								class="w-full rounded-xl border border-gray-600/50 bg-gray-700/50 p-4 text-white placeholder-gray-400 transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
								disabled={isLoading}
								required
							/>
						</div>

						<div>
							<label for="password" class="mb-2 block text-sm font-medium text-gray-300">
								App Password
							</label>
							<input
								type="password"
								id="password"
								bind:value={password}
								on:keydown={handleInputKeydown}
								placeholder="Your app password"
								class="w-full rounded-xl border border-gray-600/50 bg-gray-700/50 p-4 text-white placeholder-gray-400 transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
								disabled={isLoading}
								required
							/>
							<p class="mt-2 text-xs text-gray-400">
								Generate this in your Bluesky app settings or AT Protocol client.
							</p>
						</div>

						{#if errorMessage}
							<div class="rounded-xl border border-red-700/50 bg-red-900/50 p-4 backdrop-blur-sm">
								<p class="text-sm text-red-200">{errorMessage}</p>
							</div>
						{/if}

						<button
							type="submit"
							disabled={isLoading || !identifier || !password}
							class="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-green-700 hover:to-green-800 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
						>
							{#if isLoading}
								<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
								<span>Connecting...</span>
							{:else}
								<span>Sign In with App Password</span>
							{/if}
						</button>
					</form>
				{/if}

				<!-- Sign Up Link -->
				<div class="mt-6 text-center">
					<p class="text-sm text-gray-400">
						Don't have an account?
						<a
							href="https://bsky.app"
							target="_blank"
							rel="noopener noreferrer"
							class="text-green-400 underline transition-colors duration-200 hover:text-green-300"
						>
							Sign up on Bluesky
						</a>
					</p>
				</div>
			</div>

			<!-- Info Section -->
			<div class="mt-8 text-center">
				<details class="group text-sm text-gray-400">
					<summary
						class="mb-4 inline-flex cursor-pointer items-center space-x-2 transition-colors duration-200 hover:text-gray-300"
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
					<div
						class="space-y-3 rounded-xl border border-gray-700/30 bg-gray-800/50 p-6 backdrop-blur-sm"
					>
						<div class="flex items-start space-x-3">
							<svg
								class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400"
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
								<p class="font-medium text-gray-300">OAuth (Recommended)</p>
								<p class="text-xs text-gray-400">
									Sign in through your PDS with granular permissions. We only request access to
									write game scores.
								</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<svg
								class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400"
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
								<p class="font-medium text-gray-300">App Password</p>
								<p class="text-xs text-gray-400">
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
