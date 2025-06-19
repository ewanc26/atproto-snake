import { Snake } from './snake';
import { Food } from './food';
import { GRID_SIZE, TILE_SIZE, INITIAL_SNAKE_SPEED, SNAKE_SEGMENT_SIZE } from './constants';
import type { Direction } from './types';

export class SnakeGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private snake!: Snake;
    private food!: Food;
    private score!: number;
    private gameLoopInterval: number | undefined;
    private currentDirection!: Direction;
    private changingDirection!: boolean;
    private gracePeriodActive!: boolean;
    private gracePeriodTimer: number | undefined;
    private onGameOverCallback: () => void;
    private onScoreUpdateCallback: (score: number) => void;

    /**
     * @param canvas The HTML canvas element to draw the game on.
     * @param onGameOverCallback Callback function to be called when the game ends.
     * @param onScoreUpdateCallback Callback function to be called when the score updates.
     */
    constructor(canvas: HTMLCanvasElement, onGameOverCallback: () => void, onScoreUpdateCallback: (score: number) => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.canvas.width = GRID_SIZE * TILE_SIZE;
        this.canvas.height = GRID_SIZE * TILE_SIZE;

        this.onGameOverCallback = onGameOverCallback;
        this.onScoreUpdateCallback = onScoreUpdateCallback;

        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.resetGame();
    }

    /**
     * Changes the direction of the snake based on user input.
     * @param newDirection The new direction ('up', 'down', 'left', 'right').
     */
    public changeDirection(newDirection: Direction): void {
        if (this.changingDirection) return;

        this.changingDirection = true;

        const goingUp = this.currentDirection === 'up';
        const goingDown = this.currentDirection === 'down';
        const goingLeft = this.currentDirection === 'left';
        const goingRight = this.currentDirection === 'right';

        if (newDirection === 'left' && !goingRight) {
            this.currentDirection = 'left';
        } else if (newDirection === 'up' && !goingDown) {
            this.currentDirection = 'up';
        } else if (newDirection === 'right' && !goingLeft) {
            this.currentDirection = 'right';
        } else if (newDirection === 'down' && !goingUp) {
            this.currentDirection = 'down';
        }
    }

    /**
     * Starts the game loop.
     */
    startGame(): void {
        this.resetGame();
        this.gameLoopInterval = window.setInterval(() => this.gameLoop(), INITIAL_SNAKE_SPEED);
    }

    /**
     * The main game loop, responsible for updating game state and rendering.
     */
    private gameLoop(): void {
        this.changingDirection = false;
        this.snake.move(this.currentDirection);

        if (this.checkCollision()) {
            if (!this.gracePeriodActive) {
                this.startGracePeriod();
            } else {
                this.endGame();
                return;
            }
        } else if (this.gracePeriodActive) {
            this.clearGracePeriod();
        }

        if (this.snake.head.x === this.food.position.x && this.snake.head.y === this.food.position.y) {
            this.snake.grow();
            this.score += 1;
            this.onScoreUpdateCallback(this.score);
            this.food.generateNewPosition(this.snake.body);
        }

        this.draw();
    }

    /**
     * Draws all game elements on the canvas.
     */
    private draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawSnake();
        this.drawFood();
    }

    /**
     * Draws the snake on the canvas.
     */
    private drawSnake(): void {
        const offset = (TILE_SIZE - SNAKE_SEGMENT_SIZE) / 2;
        this.snake.body.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.fillStyle = '#006400'; // Darker green for the head
            } else {
                this.ctx.fillStyle = 'lime';
            }
            this.ctx.fillRect(
                segment.x * TILE_SIZE + offset,
                segment.y * TILE_SIZE + offset,
                SNAKE_SEGMENT_SIZE,
                SNAKE_SEGMENT_SIZE
            );
        });
    }

    /**
     * Draws the food on the canvas.
     */
    private drawFood(): void {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.food.position.x * TILE_SIZE, this.food.position.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    /**
     * Draws the current score on the canvas.
     */
    private drawScore(): void {
        // Score is now displayed in the Svelte component, so no need to draw it on canvas
    }

    /**
     * Handles keyboard input to change snake direction.
     * @param event The keyboard event.
     */
    /**
     * Handles keyboard input to change snake direction.
     * @param event The keyboard event.
     */
    private handleKeyPress(event: KeyboardEvent): void {
        const keyPressed = event.key;
        let direction: Direction | undefined;

        if (keyPressed === 'ArrowLeft') {
            direction = 'left';
        } else if (keyPressed === 'ArrowUp') {
            direction = 'up';
        } else if (keyPressed === 'ArrowRight') {
            direction = 'right';
        } else if (keyPressed === 'ArrowDown') {
            direction = 'down';
        }

        if (direction) {
            this.changeDirection(direction);
        }
    }

    /**
     * Checks for collisions with walls or the snake's own body.
     * @returns True if a collision occurred, false otherwise.
     */
    private checkCollision(): boolean {
        const head = this.snake.head;

        // Wall collision
        const hitLeftWall = head.x < 0;
        const hitRightWall = head.x >= GRID_SIZE;
        const hitTopWall = head.y < 0;
        const hitBottomWall = head.y >= GRID_SIZE;

        if (hitLeftWall || hitRightWall || hitTopWall || hitBottomWall) {
            return true;
        }

        // Self-collision
        for (let i = 1; i < this.snake.body.length; i++) {
            if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
                this.endGame(); // End game immediately on self-collision
                return true;
            }
        }

        return false;
    }

    /**
     * Starts the grace period for wall collisions.
     */
    private startGracePeriod(): void {
        this.gracePeriodActive = true;
        this.gracePeriodTimer = window.setTimeout(() => {
            this.endGame();
        }, 1000); // 1 second grace period
    }

    /**
     * Clears the grace period if the snake moves away from the wall.
     */
    private clearGracePeriod(): void {
        if (this.gracePeriodTimer) {
            clearTimeout(this.gracePeriodTimer);
            this.gracePeriodTimer = undefined;
        }
        this.gracePeriodActive = false;
    }

    /**
     * Ends the game, clearing the game loop interval.
     */
    private endGame(): void {
        if (this.gameLoopInterval) {
            window.clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = undefined; // Clear the interval ID
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.clearGracePeriod();
        this.onGameOverCallback();
    }

    /**
     * Resets the game to its initial state.
     */
    private resetGame(): void {
        if (this.gameLoopInterval) {
            window.clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = undefined;
        }
        this.snake = new Snake();
        this.food = new Food();
        this.score = 0;
        this.currentDirection = 'right';
        this.changingDirection = false;
        this.gracePeriodActive = false;
        this.clearGracePeriod();
        this.food.generateNewPosition(this.snake.body);
        this.onScoreUpdateCallback(this.score); // Update score display on reset
        this.draw(); // Draw initial state
    }
}