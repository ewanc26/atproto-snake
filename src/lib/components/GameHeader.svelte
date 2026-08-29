<script lang="ts">
	// GameHeader: shows score, user handle, avatar, and logout button
	import { getCurrentUserHandle, logout, getProfile } from '$lib/auth/auth';

	export let score: number;

	let avatar: string | undefined;

	$: userHandle = getCurrentUserHandle();

	// Function to fetch the user's profile and avatar
	async function fetchProfile() {
		if (userHandle) {
			const profile = await getProfile(userHandle);
			if (profile?.avatar) {
				avatar = profile.avatar;
			}
		}
	}

	// Reactively fetch profile when userHandle changes
	$: if (userHandle) {
		fetchProfile();
	}
</script>

<div class="w-full">
	<!-- Score and User Info Card -->
	<div class="bg-canvas-800 border-canvas-line rounded-lg border p-4">
		<div class="flex items-center justify-between">
			<!-- Score and Logout -->
			<div class="flex flex-col space-y-1">
				<div class="flex items-center space-x-3">
					<div class="bg-gold-500/10 rounded-md px-3 py-2">
						<p class="text-gold-400 text-xl font-bold sm:text-2xl">
							Score: <span class="text-ink-950">{score}</span>
						</p>
					</div>
					<button
						on:click={logout}
						class="border-ember-500/40 text-ember-400 hover:bg-ember-500/10 rounded-md border px-4 py-2 transition-colors duration-200"
					>
						Logout
					</button>
				</div>
				{#if userHandle}
					<p class="text-ink-500 font-mono text-sm">
						Playing as <span class="text-gold-400 font-medium">@{userHandle}</span>
					</p>
				{/if}
			</div>

			<!-- Avatar on the right -->
			{#if avatar}
				<img
					src={avatar}
					alt="User Avatar"
					class="border-gold-400 ml-4 h-20 w-20 rounded-full border-2"
				/>
			{/if}
		</div>
	</div>
</div>
