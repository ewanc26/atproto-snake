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
        this.ctx.imageSmoothingEnabled = false;
    }

    public draw(snake: Snake, food: Food, gracePeriodActive: boolean = false): void {
        this.clearCanvas();

        if (gracePeriodActive) {
            this.drawGracePeriodOverlay();
        }

        this.drawSnake(snake);
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

    private drawSnake(snake: Snake): void {
        const offset = (TILE_SIZE - SNAKE_SEGMENT_SIZE) / 2;

        snake.body.forEach((segment, index) => {
            const x = segment.x * TILE_SIZE + offset;
            const y = segment.y * TILE_SIZE + offset;

            if (index === 0) {
                this.ctx.fillStyle = '#004400';
                this.ctx.fillRect(x, y, SNAKE_SEGMENT_SIZE, SNAKE_SEGMENT_SIZE);

                this.ctx.fillStyle = '#FFFFFF';
                const eyeSize = 3;
                const eyeOffset = 4;
                this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                this.ctx.fillRect(x + SNAKE_SEGMENT_SIZE - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
            } else {
                const alpha = Math.max(0.6, 1 - (index * 0.02));
                this.ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                this.ctx.fillRect(x, y, SNAKE_SEGMENT_SIZE, SNAKE_SEGMENT_SIZE);
            }
        });
    }

    private drawFood(food: Food): void {
        const x = food.position.x * TILE_SIZE;
        const y = food.position.y * TILE_SIZE;

        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

        this.ctx.fillStyle = '#FF6666';
        this.ctx.fillRect(x + 4, y + 4, 4, 4);
    }

    public drawGameOver(score: number): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);

        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Final Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText('Press any key to restart', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
}