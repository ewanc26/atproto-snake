<script lang="ts">
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
    <!-- Game Title -->
    <h1 class="text-3xl sm:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
        Snake Game
    </h1>
    <!-- Score and User Info Card -->
    <div class="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-700/50">
        <div class="flex items-center justify-between">
            <!-- Score and Logout -->
            <div class="flex flex-col space-y-1">
                <div class="flex items-center space-x-3">
                    <div class="bg-green-500/20 rounded-lg px-3 py-2">
                        <p class="text-xl sm:text-2xl font-bold text-green-400">
                            Score: <span class="text-white">{score}</span>
                        </p>
                    </div>
                    <button
                        on:click={logout}
                        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                    >
                        Logout
                    </button>
                </div>
                {#if userHandle}
                    <p class="text-sm text-gray-400">
                        Playing as <span class="text-green-400 font-medium">@{userHandle}</span>
                    </p>
                {/if}
            </div>

            <!-- Avatar on the right -->
            {#if avatar}
                <img src={avatar} alt="User Avatar" class="w-20 h-20 rounded-full border-2 border-green-400 ml-4" />
            {/if}
        </div>
    </div>
</div>