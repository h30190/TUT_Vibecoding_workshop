import { GameMap } from './Map';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Physics {
  /**
   * Check if a bounding box overlaps with any solid tile in the map.
   */
  public static isCollidingWithMap(box: BoundingBox, map: GameMap): boolean {
    const startCol = Math.floor(box.x / map.tileSize);
    const endCol = Math.floor((box.x + box.width - 0.01) / map.tileSize);
    const startRow = Math.floor(box.y / map.tileSize);
    const endRow = Math.floor((box.y + box.height - 0.01) / map.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = map.getTile(c, r);
        if (tile === '#' || tile === '?') {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Resolve movement with map collisions.
   * Modifies x and y in box, returning whether collisions occurred in X or Y.
   */
  public static moveWithMapCollision(
    box: { x: number; y: number; vx: number; vy: number; width: number; height: number },
    map: GameMap
  ): { onGround: boolean; hitCeiling: boolean; hitWall: boolean } {
    let onGround = false;
    let hitCeiling = false;
    let hitWall = false;

    // Move in X
    box.x += box.vx;
    if (this.isCollidingWithMap(box, map)) {
      hitWall = true;
      // Revert and snap
      if (box.vx > 0) {
        // Collided while moving right
        box.x = Math.floor((box.x + box.width) / map.tileSize) * map.tileSize - box.width;
      } else if (box.vx < 0) {
        // Collided while moving left
        box.x = Math.floor(box.x / map.tileSize) * map.tileSize + map.tileSize;
      }
      box.vx = 0;
    }

    // Move in Y
    box.y += box.vy;
    if (this.isCollidingWithMap(box, map)) {
      if (box.vy > 0) {
        // Collided while moving down -> landed on ground
        box.y = Math.floor((box.y + box.height) / map.tileSize) * map.tileSize - box.height;
        onGround = true;
      } else if (box.vy < 0) {
        // Collided while moving up -> hit ceiling
        box.y = Math.floor(box.y / map.tileSize) * map.tileSize + map.tileSize;
        hitCeiling = true;
      }
      box.vy = 0;
    }

    return { onGround, hitCeiling, hitWall };
  }

  /**
   * Check intersection between two AABB bounding boxes.
   */
  public static checkIntersection(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
