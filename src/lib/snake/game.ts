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

    private setGameState(newState: GameState): void {
        this._gameState = newState;
        this.onStateChangeCallback?.(newState);
    }

    private startGameLoop(): void {
        this.stopGameLoop();
        this.gameLoopInterval = window.setInterval(() => this.gameLoop(), this.currentSpeed);
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
            this.triggerDeathAnimation();
            return;
        }

        if (this.snake.head.x === this.food.position.x && this.snake.head.y === this.food.position.y) {
            this.snake.grow();
            this._score++;
            this.onScoreUpdateCallback(this._score);
            this.currentSpeed = Math.max(MIN_SNAKE_SPEED, this.currentSpeed * SPEED_INCREASE_RATE);
            this.restartGameLoop();

            this.startGracePeriod();

            this.food.generateNewPosition(this.snake.body);
        }

        this.renderer.draw(this.snake, this.food, this.gracePeriodActive);
    }

    private restartGameLoop(): void {
        this.stopGameLoop();
        this.startGameLoop();
    }

    private startGracePeriod(): void {
        this.gracePeriodActive = true;
        if (this.gracePeriodTimer) clearTimeout(this.gracePeriodTimer);

        this.gracePeriodTimer = window.setTimeout(() => {
            this.gracePeriodActive = false;
        }, GRACE_PERIOD_DURATION);
    }

    private triggerDeathAnimation(): void {
        this.setGameState('animating-death');
        this.stopGameLoop();

        const deathAnimationInterval = window.setInterval(() => {
            if (!this.snake.removeLastSegment()) {
                clearInterval(deathAnimationInterval);
                this.setGameState('game-over');
                this.onGameOverCallback();
                this.renderer.drawGameOver(this._score);
            } else {
                this.renderer.draw(this.snake, this.food);
            }
        }, DEATH_ANIMATION_SPEED);
    }

    private resetGame(): void {
        this.snake.reset();
        this.currentSpeed = INITIAL_SNAKE_SPEED;
        this._score = 0;
        this.currentDirection = 'right';
        this.nextDirection = 'right';
        this.food.generateNewPosition(this.snake.body);
        this.setGameState('ready');
        this.renderer.draw(this.snake, this.food);
    }

    private handleKeyPress(event: KeyboardEvent): void {
        const keyDirectionMap: Record<string, Direction> = {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
            w: 'up',
            s: 'down',
            a: 'left',
            d: 'right'
        };

        if (keyDirectionMap[event.key]) {
            this.changeDirection(keyDirectionMap[event.key]);
            event.preventDefault();
        } else if (this._gameState === 'game-over') {
            this.startGame();
        }
    }
}