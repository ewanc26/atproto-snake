import type { Position, Direction } from './types';
import { GRID_SIZE } from './constants';

export class Snake {
    body: Position[];
    head: Position;
    segmentsToAdd: number;

    constructor() {
        this.body = [
            { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
            { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
            { x: Math.floor(GRID_SIZE / 2) - 2, y: Math.floor(GRID_SIZE / 2) }
        ];
        this.head = this.body[0];
        this.segmentsToAdd = 0;
    }

    /**
     * Moves the snake in the given direction.
     * @param direction The direction to move the snake.
     */
    move(direction: Direction): void {
        const newHead: Position = { x: this.head.x, y: this.head.y };

        switch (direction) {
            case 'up':
                newHead.y--;
                break;
            case 'down':
                newHead.y++;
                break;
            case 'left':
                newHead.x--;
                break;
            case 'right':
                newHead.x++;
                break;
        }

        this.body.unshift(newHead);
        this.head = newHead;

        // Only remove the tail if the snake is not growing
        if (this.segmentsToAdd === 0) {
            this.body.pop();
        } else {
            this.segmentsToAdd--;
        }
    }

    /**
     * Increases the number of segments to add to the snake, making it grow.
     */
    grow(): void {
        this.segmentsToAdd++;
    }
}