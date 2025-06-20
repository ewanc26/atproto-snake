<script lang="ts">
    import { login } from '$lib/auth/auth';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isLoggedIn } from '$lib/auth/auth';

    let identifier = '';
    let password = '';
    let pdsUrl = '';
    let errorMessage = '';
    let isLoading = false;

    onMount(() => {
        if (isLoggedIn()) {
            goto('/game');
        }
    });

    async function handleLogin(): Promise<void> {
        if (!identifier.trim() || !password.trim()) {
            errorMessage = 'Please enter your AT Protocol handle/DID and app password.';
            return;
        }

        errorMessage = '';
        isLoading = true;

        try {
            await login(identifier.trim(), password.trim(), pdsUrl.trim() || undefined);
        } catch (error) {
            console.error('Login error:', error);
            errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
            isLoading = false;
        }
    }

    function handleInputKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            handleLogin();
        }
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col justify-center">
    <div class="flex-1 flex items-center justify-center px-4 py-8 pb-20">
        <div class="max-w-md w-full">
            <!-- Header Section -->
            <div class="text-center mb-8">
                <div class="mb-6">
                    <h1 class="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                        Snake Game
                    </h1>
                    <p class="text-lg text-gray-300">Sign in with your AT Protocol account</p>
                </div>
            </div>

            <!-- Login Form -->
            <div class="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700/50">
                <form on:submit|preventDefault={handleLogin} class="space-y-6">
                    <!-- Handle/DID Input -->
                    <div>
                        <label for="identifier" class="block text-sm font-medium mb-2 text-gray-300">
                            AT Protocol Handle or DID
                        </label>
                        <div class="relative">
                            <input
                                type="text"
                                id="identifier"
                                bind:value={identifier}
                                on:keydown={handleInputKeydown}
                                placeholder="alice.bsky.social or did:plc:..."
                                class="w-full p-4 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                                disabled={isLoading}
                                required
                            />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-4">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-2">
                            Enter your Bluesky handle (like alice.bsky.social) or any AT Protocol identifier.
                        </p>
                    </div>

                    <!-- App Password Input -->
                    <div>
                        <label for="password" class="block text-sm font-medium mb-2 text-gray-300">
                            App Password
                        </label>
                        <div class="relative">
                            <input
                                type="password"
                                id="password"
                                bind:value={password}
                                on:keydown={handleInputKeydown}
                                placeholder="Your app password"
                                class="w-full p-4 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                                disabled={isLoading}
                                required
                            />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-4">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-2">
                            This is a 16-character password generated by your AT Protocol client (e.g., Bluesky app settings).
                        </p>
                    </div>

                    <!-- PDS URL Input (Collapsible Advanced Section) -->
                    <details class="group">
                        <summary class="cursor-pointer text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-2">
                            <svg class="w-4 h-4 transform group-open:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                            <span>Advanced Settings</span>
                        </summary>
                        <div class="mt-4 pl-6 border-l-2 border-gray-700">
                            <label for="pdsUrl" class="block text-sm font-medium mb-2 text-gray-300">
                                PDS URL (Optional)
                            </label>
                            <input
                                type="text"
                                id="pdsUrl"
                                bind:value={pdsUrl}
                                on:keydown={handleInputKeydown}
                                placeholder="https://bsky.social (default)"
                                class="w-full p-4 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                                disabled={isLoading}
                            />
                            <p class="text-xs text-gray-400 mt-2">
                                Only change this if you are using a custom Personal Data Server.
                            </p>
                        </div>
                    </details>

                    <!-- Error Message -->
                    {#if errorMessage}
                        <div class="p-4 bg-red-900/50 border border-red-700/50 rounded-xl backdrop-blur-sm">
                            <div class="flex items-center space-x-2">
                                <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p class="text-red-200 text-sm">{errorMessage}</p>
                            </div>
                        </div>
                    {/if}

                    <!-- Submit Button -->
                    <button
                        type="submit"
                        disabled={isLoading}
                        class="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                    >
                        {#if isLoading}
                            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Connecting...</span>
                        {:else}
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign In with AT Protocol</span>
                        {/if}
                    </button>
                </form>

                <!-- Sign Up Link -->
                <div class="mt-6 text-center">
                    <p class="text-sm text-gray-400">
                        Don't have an account? 
                        <a 
                            href="https://bsky.app" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="text-green-400 hover:text-green-300 underline transition-colors duration-200"
                        >
                            Sign up for Bluesky
                        </a>
                    </p>
                </div>
            </div>

            <!-- Info Section -->
            <div class="mt-8 text-center">
                <details class="text-sm text-gray-400 group">
                    <summary class="cursor-pointer hover:text-gray-300 mb-2 transition-colors duration-200 inline-flex items-center space-x-2">
                        <svg class="w-4 h-4 transform group-open:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>What is AT Protocol?</span>
                    </summary>
                    <div class="text-left bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl mt-4 border border-gray-700/30 space-y-3">
                        <p class="text-gray-300">
                            <strong>AT Protocol</strong> is a decentralized social networking protocol that powers Bluesky and other applications.
                        </p>
                        <p class="text-gray-300">
                            You can use your existing Bluesky account, or any other AT Protocol identity to sign in.
                        </p>
                        <p class="text-gray-300">
                            This game supports third-party Personal Data Servers (PDS), so you can use accounts from any AT Protocol provider.
                        </p>
                    </div>
                </details>
            </div>
        </div>
    </div>
</div>