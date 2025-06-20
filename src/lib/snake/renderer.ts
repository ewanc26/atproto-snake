import { GRID_SIZE } from './constants';
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

    public draw(snake: Snake, food: Food, gracePeriodActive: boolean = false): void {
        this.snake = snake;
        this.food = food;

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
        const offset = (this.tileSize - this.segmentSize) / 2;

        snake.body.forEach((segment, index) => {
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

    public drawGameOver(score: number): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${Math.floor(this.canvas.width / 15)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);

        this.ctx.font = `${Math.floor(this.canvas.width / 25)}px Arial`;
        this.ctx.fillText(`Final Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = `${Math.floor(this.canvas.width / 35)}px Arial`;
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText('Press any key to restart', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
}