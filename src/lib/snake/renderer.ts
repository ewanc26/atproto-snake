import type { Position } from './types';
import { GRID_SIZE, TILE_SIZE, SNAKE_SEGMENT_SIZE } from './constants';
import { Snake } from './snake';
import { Food } from './food';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.canvas.width = GRID_SIZE * TILE_SIZE;
        this.canvas.height = GRID_SIZE * TILE_SIZE;
    }

    /**
     * Draws all game elements on the canvas.
     * @param snake The snake object to draw.
     * @param food The food object to draw.
     */
    public draw(snake: Snake, food: Food): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawSnake(snake);
        this.drawFood(food);
    }

    /**
     * Draws the snake on the canvas.
     * @param snake The snake object to draw.
     */
    private drawSnake(snake: Snake): void {
        const offset = (TILE_SIZE - SNAKE_SEGMENT_SIZE) / 2;
        snake.body.forEach((segment, index) => {
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
     * @param food The food object to draw.
     */
    private drawFood(food: Food): void {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(food.position.x * TILE_SIZE, food.position.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    /**
     * Draws the game over screen.
     * @param score The final score.
     */
    public drawGameOver(score: number): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
}