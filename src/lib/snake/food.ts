import type { Position } from './types';
import { GRID_SIZE } from './constants';

export class Food {
    position: Position;

    constructor() {
        this.position = { x: 0, y: 0 }; // Initial dummy position
    }

    /**
     * Generates a new random position for the food, ensuring it doesn't overlap with the snake.
     * @param snakeBody The current body segments of the snake.
     */
    generateNewPosition(snakeBody: Position[]): void {
        let newX: number;
        let newY: number;
        let collision: boolean;

        do {
            newX = Math.floor(Math.random() * GRID_SIZE);
            newY = Math.floor(Math.random() * GRID_SIZE);
            collision = false;
            for (const segment of snakeBody) {
                if (segment.x === newX && segment.y === newY) {
                    collision = true;
                    break;
                }
            }
        } while (collision);

        this.position = { x: newX, y: newY };
    }
}