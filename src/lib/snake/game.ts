import { Snake } from './snake';
import { Food } from './food';
import { INITIAL_SNAKE_SPEED, MIN_SNAKE_SPEED, SPEED_INCREASE_RATE, GRACE_PERIOD_DURATION, DEATH_ANIMATION_SPEED } from './constants';
import type { Direction, GameState } from './types';
import { GameRenderer } from './renderer';

export class SnakeGame {
    private renderer: GameRenderer;
    private snake: Snake;
    private food: Food;
    private _score: number = 0;
    private _gameState: GameState = 'ready';
    private gameLoopInterval?: number;
    private currentDirection: Direction = 'right';
    private nextDirection: Direction = 'right';
    private currentSpeed: number = INITIAL_SNAKE_SPEED;
    
    private gracePeriodActive: boolean = false;
    private gracePeriodTimer?: number;
    
    private onGameOverCallback: () => void;
    private onScoreUpdateCallback: (score: number) => void;
    private onStateChangeCallback?: (state: GameState) => void;

    public get score(): number { return this._score; }
    public get gameState(): GameState { return this._gameState; }
    public get speed(): number { return this.currentSpeed; }

    constructor(
        canvas: HTMLCanvasElement, 
        onGameOverCallback: () => void, 
        onScoreUpdateCallback: (score: number) => void,
        onStateChangeCallback?: (state: GameState) => void
    ) {
        this.renderer = new GameRenderer(canvas);
        this.snake = new Snake();
        this.food = new Food();
        
        this.onGameOverCallback = onGameOverCallback;
        this.onScoreUpdateCallback = onScoreUpdateCallback;
        this.onStateChangeCallback = onStateChangeCallback;

        this.setupEventListeners();
        this.resetGame();
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && this._gameState === 'playing') {
                this.togglePause();
                event.preventDefault();
            }
        });
    }

    public changeDirection(newDirection: Direction): void {
        if (this._gameState !== 'playing') return;

        const opposites: Record<Direction, Direction> = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposites[this.currentDirection] !== newDirection) {
            this.nextDirection = newDirection;
        }
    }

    public startGame(): void {
        if (this._gameState === 'game-over' || this._gameState === 'ready') {
            this.resetGame();
        }
        this.setGameState('playing');
        this.startGameLoop();
    }

    public togglePause(): void {
        if (this._gameState === 'playing') {
            this.setGameState('paused');
            this.stopGameLoop();
        } else if (this._gameState === 'paused') {
            this.setGameState('playing');
            this.startGameLoop();
        }
    }

    private setGameState(state: GameState): void {
        this._gameState = state;
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback(state);
        }
    }

    private resetGame(): void {
        this.snake.reset();
        this.food.generateNewPosition(this.snake.body);
        this._score = 0;
        this.currentSpeed = INITIAL_SNAKE_SPEED;
        this.currentDirection = 'right';
        this.nextDirection = 'right';
        this.gracePeriodActive = true;

        if (this.gracePeriodTimer) clearTimeout(this.gracePeriodTimer);
        this.gracePeriodTimer = window.setTimeout(() => {
            this.gracePeriodActive = false;
        }, GRACE_PERIOD_DURATION);

        this.renderer.draw(this.snake, this.food, this.gracePeriodActive);
    }

    private startGameLoop(): void {
        this.stopGameLoop();

        this.gameLoopInterval = window.setInterval(() => {
            this.gameLoop();
        }, this.currentSpeed);
    }

    private stopGameLoop(): void {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = undefined;
        }
    }

    private gameLoop(): void {

        this.currentDirection = this.nextDirection;
        this.snake.move(this.currentDirection);

        if (this.snake.checkWallCollision() || this.snake.checkSelfCollision()) {
            this.handleGameOver();
        }

        if (this.snake.head.x === this.food.position.x && this.snake.head.y === this.food.position.y) {
            this.snake.grow();
            this._score++;
            this.onScoreUpdateCallback(this._score);
            this.food.generateNewPosition(this.snake.body);

            // Increase speed, capped
            this.currentSpeed = Math.max(MIN_SNAKE_SPEED, this.currentSpeed * SPEED_INCREASE_RATE);
            this.startGameLoop();
        }

        this.renderer.draw(this.snake, this.food);
    }

    private handleGameOver(): void {
        console.log('handleGameOver called'); // Add logging here
        this.stopGameLoop();
        this.setGameState('game-over');
        this.renderer.drawGameOver(this._score, () => {
            this.onGameOverCallback();
        });
    }

    private handleKeyPress(event: KeyboardEvent): void {
        const directionMap: { [key: string]: Direction } = {
            'ArrowUp': 'up',
            'w': 'up',
            'W': 'up',
            'ArrowDown': 'down',
            's': 'down',
            'S': 'down',
            'ArrowLeft': 'left',
            'a': 'left',
            'A': 'left',
            'ArrowRight': 'right',
            'd': 'right',
            'D': 'right',
        };

        const direction = directionMap[event.key];
        if (direction) {
            this.changeDirection(direction);
        } else if (event.key === 'Enter' || event.key === ' ') {
            if (this._gameState === 'game-over') {
                this.startGame();
            }
        }
    }
}