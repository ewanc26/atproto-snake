export type Position = {
    x: number;
    y: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameState = 'ready' | 'playing' | 'paused' | 'game-over';