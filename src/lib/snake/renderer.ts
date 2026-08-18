// ── Canvas Renderer ─────────────────────────────────────────
// Handles all drawing for the Snake game: the background grid,
// snake body (with a directional glowing head), food, the
// grace-period flash, and the death animation sequence.
//
// The background/grid/grace-flash colors are the same OKLCH tokens as
// the surrounding UI chrome (app.css) so the canvas reads as part of
// the same warm design system rather than a separate cool-gray layer.
// Snake/food keep the green/red game convention regardless of theme.

import { GRID_SIZE, DEATH_ANIMATION_SPEED } from './constants';
import { Snake } from './snake';
import { Food } from './food';
import type { Position } from './types';

const COLOR_BG_TOP = 'oklch(20.5% 0.038 70.3)'; // --color-canvas-900
const COLOR_BG_BOTTOM = 'oklch(17.3% 0.03 70.3)'; // --color-canvas-950
const COLOR_GRID_LINE = 'oklch(90% 0.02 70.3 / 0.05)';
const COLOR_GRACE_OVERLAY = 'oklch(69.5% 0.157 70.3 / 0.1)'; // --color-gold-500 — "wait", not "danger"

const COLOR_HEAD = '#4ade80'; // green-400
const COLOR_HEAD_OUTLINE = '#166534'; // green-800
const COLOR_HEAD_GLOW = 'rgba(74, 222, 128, 0.65)';
const COLOR_BODY_START = '#22c55e'; // green-500
const COLOR_BODY_END = '#14532d'; // green-900
const COLOR_EYE = '#052e16';

const COLOR_FOOD_CORE = '#f87171'; // red-400
const COLOR_FOOD_EDGE = '#b91c1c'; // red-700
const COLOR_FOOD_GLOW = 'rgba(248, 113, 113, 0.7)';
const COLOR_FOOD_SHINE = 'rgba(255, 255, 255, 0.75)';

export class GameRenderer {
	private ctx: CanvasRenderingContext2D;
	private canvas: HTMLCanvasElement;
	private snake!: Snake;
	private food!: Food;
	private backgroundGradient?: CanvasGradient;

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
		this.backgroundGradient = undefined;
	}

	// ─── Layout ────────────────────────────────────────────

	private get tileSize(): number {
		return this.canvas.width / GRID_SIZE;
	}

	// Segment drawn slightly smaller than tile for visual breathing room
	private get segmentSize(): number {
		return this.tileSize * 0.9;
	}

	// ─── Drawing ───────────────────────────────────────────

	public draw(
		snake: Snake,
		food: Food,
		gracePeriodActive: boolean = false,
		segmentsToDraw?: number
	): void {
		this.snake = snake;
		this.food = food;

		this.clearCanvas();

		if (gracePeriodActive) {
			this.drawGracePeriodOverlay();
		}

		this.drawFood(food);
		this.drawSnake(snake, segmentsToDraw);
	}

	private clearCanvas(): void {
		if (!this.backgroundGradient) {
			const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
			gradient.addColorStop(0, COLOR_BG_TOP);
			gradient.addColorStop(1, COLOR_BG_BOTTOM);
			this.backgroundGradient = gradient;
		}

		this.ctx.fillStyle = this.backgroundGradient;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawGrid();
	}

	private drawGrid(): void {
		this.ctx.strokeStyle = COLOR_GRID_LINE;
		this.ctx.lineWidth = 1;

		for (let i = 1; i < GRID_SIZE; i++) {
			const pos = Math.round(i * this.tileSize) + 0.5;

			this.ctx.beginPath();
			this.ctx.moveTo(pos, 0);
			this.ctx.lineTo(pos, this.canvas.height);
			this.ctx.stroke();

			this.ctx.beginPath();
			this.ctx.moveTo(0, pos);
			this.ctx.lineTo(this.canvas.width, pos);
			this.ctx.stroke();
		}
	}

	// Flashes briefly after game start so the player can orient themselves
	private drawGracePeriodOverlay(): void {
		this.ctx.fillStyle = COLOR_GRACE_OVERLAY;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	private drawSnake(snake: Snake, segmentsToDraw?: number): void {
		const offset = (this.tileSize - this.segmentSize) / 2;
		const bodyToDraw =
			segmentsToDraw !== undefined ? snake.body.slice(0, segmentsToDraw) : snake.body;
		const radius = this.segmentSize * 0.3;

		// Draw tail-to-head so nothing overlaps the head's glow
		for (let index = bodyToDraw.length - 1; index >= 0; index--) {
			const segment = bodyToDraw[index];
			const x = segment.x * this.tileSize + offset;
			const y = segment.y * this.tileSize + offset;

			if (index === 0) {
				this.drawHead(x, y, bodyToDraw[1]);
			} else {
				this.ctx.globalAlpha = Math.max(0.35, 1 - index * 0.025);
				this.ctx.fillStyle = this.bodyColorAt(index, bodyToDraw.length);
				this.roundRect(x, y, this.segmentSize, this.segmentSize, radius);
				this.ctx.fill();
				this.ctx.globalAlpha = 1;
			}
		}
	}

	// Fades from bright green at the neck to a deep, near-black green at the tail
	private bodyColorAt(index: number, total: number): string {
		const t = total > 1 ? index / total : 0;
		return this.lerpColor(COLOR_BODY_START, COLOR_BODY_END, t);
	}

	private drawHead(x: number, y: number, neck?: Position): void {
		const headRadius = this.segmentSize * 0.35;

		this.ctx.save();
		this.ctx.shadowColor = COLOR_HEAD_GLOW;
		this.ctx.shadowBlur = this.segmentSize * 0.4;
		this.ctx.fillStyle = COLOR_HEAD;
		this.roundRect(x, y, this.segmentSize, this.segmentSize, headRadius);
		this.ctx.fill();
		this.ctx.restore();

		this.ctx.strokeStyle = COLOR_HEAD_OUTLINE;
		this.ctx.lineWidth = Math.max(1, this.segmentSize * 0.05);
		this.roundRect(x, y, this.segmentSize, this.segmentSize, headRadius);
		this.ctx.stroke();

		this.drawEyes(x, y, neck);
	}

	// Eyes sit on the leading edge of the head, oriented by travel
	// direction (derived from the head's position relative to the neck).
	private drawEyes(x: number, y: number, neck?: Position): void {
		let dx = 1;
		let dy = 0;

		if (neck) {
			dx = Math.sign(this.snake.head.x - neck.x);
			dy = Math.sign(this.snake.head.y - neck.y);
			if (dx === 0 && dy === 0) dx = 1;
		}

		const eyeSize = this.segmentSize * 0.16;
		const forward = this.segmentSize * 0.28;
		const spread = this.segmentSize * 0.22;
		const cx = x + this.segmentSize / 2 + dx * forward;
		const cy = y + this.segmentSize / 2 + dy * forward;
		const perpX = dy !== 0 ? spread : 0;
		const perpY = dx !== 0 ? spread : 0;

		this.ctx.fillStyle = COLOR_EYE;
		[-1, 1].forEach((side) => {
			this.ctx.beginPath();
			this.ctx.arc(cx + side * perpX, cy + side * perpY, eyeSize, 0, Math.PI * 2);
			this.ctx.fill();
		});
	}

	private drawFood(food: Food): void {
		const cx = food.position.x * this.tileSize + this.tileSize / 2;
		const cy = food.position.y * this.tileSize + this.tileSize / 2;
		const r = this.tileSize * 0.36;

		this.ctx.save();
		this.ctx.shadowColor = COLOR_FOOD_GLOW;
		this.ctx.shadowBlur = this.tileSize * 0.35;

		const gradient = this.ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
		gradient.addColorStop(0, COLOR_FOOD_CORE);
		gradient.addColorStop(1, COLOR_FOOD_EDGE);
		this.ctx.fillStyle = gradient;
		this.ctx.beginPath();
		this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.restore();

		this.ctx.fillStyle = COLOR_FOOD_SHINE;
		this.ctx.beginPath();
		this.ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.18, 0, Math.PI * 2);
		this.ctx.fill();
	}

	// ─── Shape Helpers ─────────────────────────────────────

	private roundRect(x: number, y: number, w: number, h: number, r: number): void {
		this.ctx.beginPath();
		this.ctx.moveTo(x + r, y);
		this.ctx.arcTo(x + w, y, x + w, y + h, r);
		this.ctx.arcTo(x + w, y + h, x, y + h, r);
		this.ctx.arcTo(x, y + h, x, y, r);
		this.ctx.arcTo(x, y, x + w, y, r);
		this.ctx.closePath();
	}

	private lerpColor(from: string, to: string, t: number): string {
		const a = this.hexToRgb(from);
		const b = this.hexToRgb(to);
		const r = Math.round(a.r + (b.r - a.r) * t);
		const g = Math.round(a.g + (b.g - a.g) * t);
		const bl = Math.round(a.b + (b.b - a.b) * t);
		return `rgb(${r}, ${g}, ${bl})`;
	}

	private hexToRgb(hex: string): { r: number; g: number; b: number } {
		const int = parseInt(hex.slice(1), 16);
		return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
	}

	// ─── Death Animation ──────────────────────────────────

	private deathAnimationInterval?: number;
	private deathAnimationStep: number = 0;

	/**
	 * Shrinks the snake segment by segment, then invokes the callback
	 * once the canvas is clear.
	 */
	public drawGameOver(callback?: () => void): void {
		this.stopDeathAnimation(); // Ensure any previous animation is stopped
		this.deathAnimationStep = this.snake.body.length;

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

	private stopDeathAnimation(): void {
		if (this.deathAnimationInterval) {
			clearInterval(this.deathAnimationInterval);
			this.deathAnimationInterval = undefined;
			this.deathAnimationStep = 0;
		}
	}
}
