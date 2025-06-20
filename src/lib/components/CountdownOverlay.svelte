<script lang="ts">
    export let countdown: number;
</script>

<div class="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm text-white rounded-xl">
    <div class="text-center">
        <!-- Animated countdown number -->
        <div class="relative mb-4">
            <div class="text-8xl sm:text-9xl font-bold text-green-400 animate-pulse">
                {countdown}
            </div>
            <!-- Glow effect -->
            <div class="absolute inset-0 text-8xl sm:text-9xl font-bold text-green-400/30 blur-xl">
                {countdown}
            </div>
        </div>
        
        <!-- Get ready text -->
        <p class="text-xl sm:text-2xl font-medium text-gray-300 animate-bounce">
            Get Ready!
        </p>
        
        <!-- Progress dots -->
        <div class="flex justify-center space-x-2 mt-6">
            {#each Array(3) as _, i}
                <div class="w-3 h-3 rounded-full transition-all duration-300 {i < (3 - countdown) ? 'bg-green-400' : 'bg-gray-600'}"></div>
            {/each}
        </div>
    </div>
</div>