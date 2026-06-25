// ── Snake Entity ─────────────────────────────────────────────
// Tracks body segments, handles movement, collision detection,
// and growth state. The snake starts centered on the grid.

import type { Position, Direction } from './types';
import { GRID_SIZE } from './constants';

export class Snake {
    body: Position[] = [];
    private _head: Position;
    private segmentsToAdd: number;
    private readonly initialLength: number = 3;

    constructor() {
        this.initializeSnake();
        this._head = this.body[0];
        this.segmentsToAdd = 0;
    }

    get head(): Position {
        return this._head;
    }

    get length(): number {
        return this.body.length;
    }

    // ─── Initialisation ─────────────────────────────────────

    private initializeSnake(): void {
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);
        
        this.body = [];
        for (let i = 0; i < this.initialLength; i++) {
            this.body.push({ x: centerX - i, y: centerY });
        }
    }

    // ─── Movement ──────────────────────────────────────────

    move(direction: Direction): void {
        const newHead = this.calculateNewHeadPosition(direction);
        this.body.unshift(newHead);
        this._head = newHead;

        // Only pop the tail if we aren't growing this frame
        if (this.segmentsToAdd > 0) {
            this.segmentsToAdd--;
        } else {
            this.body.pop();
        }
    }

    private calculateNewHeadPosition(direction: Direction): Position {
        const newHead: Position = { ...this._head };

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

        return newHead;
    }

    // ─── Growth ────────────────────────────────────────────

    grow(): void {
        this.segmentsToAdd++;
    }

    // ─── Collision Detection ────────────────────────────────

    checkSelfCollision(): boolean {
        const head = this._head;
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }

    checkWallCollision(): boolean {
        const head = this._head;
        return head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
    }

    // ─── Lifecycle ─────────────────────────────────────────

    reset(): void {
        this.initializeSnake();
        this._head = this.body[0];
        this.segmentsToAdd = 0;
    }

    removeLastSegment(): boolean {
        if (this.body.length > 0) {
            this.body.pop();
            if (this.body.length > 0) {
                this._head = this.body[0];
            }
            return true;
        }
        return false;
    }
}