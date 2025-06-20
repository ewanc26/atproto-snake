import type { Position } from './types';
import { GRID_SIZE } from './constants';

export class Food {
    position: Position;
    private static readonly MAX_PLACEMENT_ATTEMPTS = 100;

    constructor() {
        this.position = { x: 0, y: 0 };
    }

    generateNewPosition(snakeBody: Position[]): void {
        if (snakeBody.length >= GRID_SIZE * GRID_SIZE - 1) {
            console.warn('Board nearly full, placing food at remaining space');
            this.findLastAvailableSpace(snakeBody);
            return;
        }

        let attempts = 0;
        let newPosition: Position;

        do {
            newPosition = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            attempts++;
        } while (this.isPositionOccupied(newPosition, snakeBody) && attempts < Food.MAX_PLACEMENT_ATTEMPTS);

        if (attempts >= Food.MAX_PLACEMENT_ATTEMPTS) {
            newPosition = this.findFirstAvailablePosition(snakeBody);
        }

        this.position = newPosition;
    }

    private isPositionOccupied(position: Position, snakeBody: Position[]): boolean {
        return snakeBody.some(segment => segment.x === position.x && segment.y === position.y);
    }

    private findFirstAvailablePosition(snakeBody: Position[]): Position {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const position = { x, y };
                if (!this.isPositionOccupied(position, snakeBody)) {
                    return position;
                }
            }
        }
        return { x: 0, y: 0 };
    }

    private findLastAvailableSpace(snakeBody: Position[]): void {
        this.position = this.findFirstAvailablePosition(snakeBody);
    }
}