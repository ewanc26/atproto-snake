import { Snake } from './snake';
import { Food } from './food';
import { GRID_SIZE, TILE_SIZE, INITIAL_SNAKE_SPEED } from './constants';
import type { Position, Direction } from './types';

export class SnakeGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private snake: Snake;
    private food: Food;
    private score: number;
    private gameLoopInterval: number | undefined;
    private currentDirection: Direction;
    private changingDirection: boolean;
    private gracePeriodActive: boolean;
    private gracePeriodTimer: number | undefined;

    /**
     * @param canvas The HTML canvas element to draw the game on.
     */
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.canvas.width = GRID_SIZE * TILE_SIZE;
        this.canvas.height = GRID_SIZE * TILE_SIZE;

        this.snake = new Snake();
        this.food = new Food();
        this.score = 0;
        this.currentDirection = 'right';
        this.changingDirection = false;
        this.gracePeriodActive = false;

        this.food.generateNewPosition(this.snake.body);

        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    /**
     * Starts the game loop.
     */
    startGame(): void {
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
        this.drawScore();
    }

    /**
     * Draws the snake on the canvas.
     */
    private drawSnake(): void {
        this.ctx.fillStyle = 'lime';
        this.snake.body.forEach(segment => {
            this.ctx.fillRect(segment.x * TILE_SIZE, segment.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
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
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    }

    /**
     * Handles keyboard input to change snake direction.
     * @param event The keyboard event.
     */
    private handleKeyPress(event: KeyboardEvent): void {
        if (this.changingDirection) return;
        this.changingDirection = true;

        const keyPressed = event.key;
        const goingUp = this.currentDirection === 'up';
        const goingDown = this.currentDirection === 'down';
        const goingLeft = this.currentDirection === 'left';
        const goingRight = this.currentDirection === 'right';

        if (keyPressed === 'ArrowLeft' && !goingRight) {
            this.currentDirection = 'left';
        } else if (keyPressed === 'ArrowUp' && !goingDown) {
            this.currentDirection = 'up';
        } else if (keyPressed === 'ArrowRight' && !goingLeft) {
            this.currentDirection = 'right';
        } else if (keyPressed === 'ArrowDown' && !goingUp) {
            this.currentDirection = 'down';
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
            clearInterval(this.gameLoopInterval);
        }
        this.clearGracePeriod(); // Ensure grace period timer is cleared
        console.log('Game Over! Score:', this.score);
        alert(`Game Over! Your score: ${this.score}`);
    }
}