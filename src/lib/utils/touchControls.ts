import type { SnakeGame } from '$lib/snake/game';

/**
 * Sets up touch controls for the game on the canvas.
 * @param canvasElement The HTML canvas element to attach touch listeners to.
 * @param game The SnakeGame instance to control.
 */
export function setupTouchControls(canvasElement: HTMLCanvasElement, game: SnakeGame) {
    let touchStartX = 0;
    let touchStartY = 0;

    canvasElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });

    canvasElement.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    canvasElement.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (dx > 0) {
                game.changeDirection('right');
            } else {
                game.changeDirection('left');
            }
        } else {
            // Vertical swipe
            if (dy > 0) {
                game.changeDirection('down');
            } else {
                game.changeDirection('up');
            }
        }
    });
}