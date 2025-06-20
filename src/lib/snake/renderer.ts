import { GRID_SIZE, DEATH_ANIMATION_SPEED } from './constants';
import { Snake } from './snake';
import { Food } from './food';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private snake!: Snake;
    private food!: Food;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;

        this.resizeCanvas();

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            // Redraw with current game state after resizing
            if (this.snake && this.food) {
                this.draw(this.snake, this.food);
            }
        });
    }

    private resizeCanvas() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;

        const size = Math.min(containerWidth, containerHeight);
        this.canvas.width = size;
        this.canvas.height = size;
    }

    private get tileSize(): number {
        return this.canvas.width / GRID_SIZE;
    }

    private get segmentSize(): number {
        return this.tileSize * 0.9; // Slight padding inside tile
    }

    public draw(snake: Snake, food: Food, gracePeriodActive: boolean = false, segmentsToDraw?: number): void {
        this.snake = snake;
        this.food = food;

        this.clearCanvas();

        if (gracePeriodActive) {
            this.drawGracePeriodOverlay();
        }

        this.drawSnake(snake, segmentsToDraw);
        this.drawFood(food);
    }

    private clearCanvas(): void {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawGracePeriodOverlay(): void {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawSnake(snake: Snake, segmentsToDraw?: number): void {
        const offset = (this.tileSize - this.segmentSize) / 2;

        const bodyToDraw = segmentsToDraw !== undefined ? snake.body.slice(0, segmentsToDraw) : snake.body;

        bodyToDraw.forEach((segment, index) => {
            const x = segment.x * this.tileSize + offset;
            const y = segment.y * this.tileSize + offset;

            if (index === 0) {
                // Head
                this.ctx.fillStyle = '#004400';
                this.ctx.fillRect(x, y, this.segmentSize, this.segmentSize);

                this.ctx.fillStyle = '#FFFFFF';
                const eyeSize = this.segmentSize * 0.17;
                const eyeOffset = this.segmentSize * 0.22;
                this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                this.ctx.fillRect(x + this.segmentSize - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
            } else {
                // Body with fading effect
                const alpha = Math.max(0.6, 1 - (index * 0.02));
                this.ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                this.ctx.fillRect(x, y, this.segmentSize, this.segmentSize);
            }
        });
    }

    private drawFood(food: Food): void {
        const x = food.position.x * this.tileSize;
        const y = food.position.y * this.tileSize;

        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x + this.tileSize * 0.1, y + this.tileSize * 0.1, this.tileSize * 0.8, this.tileSize * 0.8);

        this.ctx.fillStyle = '#FF6666';
        this.ctx.fillRect(x + this.tileSize * 0.2, y + this.tileSize * 0.2, this.tileSize * 0.2, this.tileSize * 0.2);
    }

    /**
     * Draws the game over screen with score and restart instructions.
     * @param score The final score to display.
     */
    /**
     * Draws the game over state, including a death animation and final score.
     * @param finalScore The player's score at the end of the game.
     * @param callback An optional callback function to execute after the animation completes.
     */
    public drawGameOver(finalScore: number, callback?: () => void): void {
        this.stopDeathAnimation(); // Ensure any previous animation is stopped
        const initialSnakeLength = this.snake.body.length;
        this.deathAnimationStep = initialSnakeLength;

        this.deathAnimationInterval = window.setInterval(() => {
            this.deathAnimationStep--;
            if (this.deathAnimationStep >= 0) {
                this.draw(this.snake, this.food, false, this.deathAnimationStep);
            } else {
                this.stopDeathAnimation();
                this.clearCanvas(); // Clear the canvas entirely to remove the snake
                if (callback) {
                    callback();
                }
            }
        }, DEATH_ANIMATION_SPEED);
    }

    private deathAnimationInterval?: number;
    private deathAnimationStep: number = 0;

    private drawDeathAnimation(): void {
        // This method is no longer used for the new death animation.
        // The animation logic is now directly within drawGameOver.
    }

    private stopDeathAnimation(): void {
        if (this.deathAnimationInterval) {
            clearInterval(this.deathAnimationInterval);
            this.deathAnimationInterval = undefined;
            this.deathAnimationStep = 0;
        }
    }

    private drawScoreOverlay(score: number): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, this.canvas.height / 3, this.canvas.width, this.canvas.height / 3);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold ' + (this.canvas.width / 10) + 'px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - (this.canvas.width / 20));

        this.ctx.font = (this.canvas.width / 20) + 'px Arial';
        this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + (this.canvas.width / 20));
    }
}