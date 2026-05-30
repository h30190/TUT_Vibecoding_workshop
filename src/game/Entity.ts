import { GameMap } from './Map';
import { Physics } from './Physics';
import type { BoundingBox } from './Physics';

export abstract class Entity implements BoundingBox {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public vx: number = 0;
  public vy: number = 0;
  public isDead: boolean = false;
  
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  abstract update(map: GameMap, ticks: number): void;
  abstract draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void;
}

// ----------------------------------------------------
// AXE PROJECTILE
// ----------------------------------------------------
export class Axe extends Entity {
  private rotation: number = 0;
  
  constructor(x: number, y: number, dir: number) {
    super(x, y, 10, 10);
    this.vx = dir * 4;
    this.vy = -5.5; // Thrown upwards in an arc
  }

  public update(map: GameMap, _ticks: number) {
    this.vy += 0.25; // Gravity on the axe
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += 0.2;

    // Check if it falls off screen or hits a solid block
    if (this.y > map.height || Physics.isCollidingWithMap(this, map)) {
      this.isDead = true;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    ctx.save();
    ctx.translate(this.x + this.width / 2 - camX, this.y + this.height / 2 - camY);
    ctx.rotate(this.rotation);
    
    // Draw 8-bit stone axe / cyber spinner
    ctx.fillStyle = '#e4e4e7'; // Blade
    ctx.fillRect(-5, -5, 6, 6);
    ctx.fillStyle = '#f59e0b'; // Handle
    ctx.fillRect(-2, 0, 4, 8);
    ctx.fillStyle = '#00f0ff'; // Cyber glow tip
    ctx.fillRect(0, -5, 2, 2);
    
    ctx.restore();
  }
}

// ----------------------------------------------------
// ENEMIES
// ----------------------------------------------------
export class Slime extends Entity {
  private speed: number = 0.8;
  private animFrame: number = 0;
  private direction: number = 1;

  constructor(x: number, y: number) {
    super(x, y, 16, 12);
    this.vx = this.speed;
  }

  public update(map: GameMap, ticks: number) {
    this.animFrame = Math.floor(ticks / 10) % 2;
    
    // Apply gravity
    this.vy += 0.3;
    if (this.vy > 6) this.vy = 6;
    
    this.vx = this.direction * this.speed;
    
    // Move with map collision
    const res = Physics.moveWithMapCollision(this, map);
    
    // Turn around when hitting a wall
    if (res.hitWall) {
      this.direction *= -1;
    }
    
    // Platform edge detection (so it doesn't walk into pits)
    if (res.onGround) {
      const nextX = this.x + (this.direction > 0 ? this.width : -4);
      const belowTileY = Math.floor((this.y + this.height + 4) / map.tileSize);
      const belowTileX = Math.floor(nextX / map.tileSize);
      const tileBelow = map.getTile(belowTileX, belowTileY);
      
      if (tileBelow !== '#' && tileBelow !== '?') {
        this.direction *= -1;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    const rx = this.x - camX;
    const ry = this.y - camY;

    ctx.save();
    ctx.fillStyle = '#10b981'; // Cyber Emerald Slime
    
    if (this.animFrame === 0) {
      // Wide/Squashed
      ctx.fillRect(rx, ry + 2, this.width, this.height - 2);
      ctx.fillStyle = '#34d399'; // Highlight
      ctx.fillRect(rx + 2, ry + 2, this.width - 4, 3);
      // Face
      ctx.fillStyle = '#fff';
      ctx.fillRect(rx + 4, ry + 6, 2, 2);
      ctx.fillRect(rx + 10, ry + 6, 2, 2);
    } else {
      // Tall/Stretched
      ctx.fillRect(rx + 1, ry, this.width - 2, this.height);
      ctx.fillStyle = '#34d399'; // Highlight
      ctx.fillRect(rx + 3, ry, this.width - 6, 3);
      // Face
      ctx.fillStyle = '#fff';
      ctx.fillRect(rx + 4, ry + 4, 2, 2);
      ctx.fillRect(rx + 10, ry + 4, 2, 2);
    }
    
    ctx.restore();
  }
}

export class Bat extends Entity {
  private angle: number = 0;
  private animFrame: number = 0;

  constructor(x: number, y: number) {
    super(x, y, 16, 12);
    this.angle = Math.random() * Math.PI * 2;
  }

  public update(_map: GameMap, ticks: number) {
    this.animFrame = Math.floor(ticks / 8) % 2;
    
    // Flying sinusoidal wave movement
    this.angle += 0.05;
    this.vx = -1.0;
    this.vy = Math.sin(this.angle) * 0.8;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Off screen left boundary check
    if (this.x < -32) {
      this.isDead = true;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    const rx = this.x - camX;
    const ry = this.y - camY;

    ctx.save();
    ctx.fillStyle = '#ec4899'; // Hot Cyber Pink Bat

    if (this.animFrame === 0) {
      // Wings up
      ctx.fillRect(rx + 4, ry + 2, 8, 8); // Body
      ctx.fillRect(rx, ry, 4, 4); // Left Wing
      ctx.fillRect(rx + 12, ry, 4, 4); // Right Wing
    } else {
      // Wings down
      ctx.fillRect(rx + 4, ry + 2, 8, 8); // Body
      ctx.fillRect(rx, ry + 6, 4, 4); // Left Wing
      ctx.fillRect(rx + 12, ry + 6, 4, 4); // Right Wing
    }
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(rx + 6, ry + 4, 1, 1);
    ctx.fillRect(rx + 9, ry + 4, 1, 1);

    ctx.restore();
  }
}

// ----------------------------------------------------
// COINS / FRUITS / COLLECTIBLES
// ----------------------------------------------------
export class Collectible extends Entity {
  public type: 'coin' | 'fruit';
  private bounceOffset: number = 0;

  constructor(x: number, y: number, type: 'coin' | 'fruit') {
    super(x, y, 12, 12);
    this.type = type;
    this.bounceOffset = Math.random() * Math.PI;
  }

  public update(_map: GameMap, _ticks: number) {
    // Hover animation
    this.bounceOffset += 0.08;
    this.vy = Math.sin(this.bounceOffset) * 0.15;
    this.y += this.vy;
  }

  public draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    const rx = this.x - camX;
    const ry = this.y - camY;

    ctx.save();
    if (this.type === 'coin') {
      // Spinning gold coin
      ctx.fillStyle = '#fbbf24'; // Orange/gold
      ctx.fillRect(rx + 2, ry, 8, 12);
      ctx.fillStyle = '#fef08a'; // Bright yellow center
      ctx.fillRect(rx + 4, ry + 2, 4, 8);
    } else {
      // Cyber Neon Red/Green Fruit (e.g. cherry/melon)
      ctx.fillStyle = '#ef4444'; // Red body
      ctx.fillRect(rx + 2, ry + 4, 8, 8);
      ctx.fillStyle = '#10b981'; // Green leaf
      ctx.fillRect(rx + 6, ry, 2, 4);
    }
    ctx.restore();
  }
}

// ----------------------------------------------------
// PLAYER CHARACTER
// ----------------------------------------------------
export class Player extends Entity {
  public hp: number = 3;
  public food: number = 100;
  public score: number = 0;
  public hitCeiling: boolean = false;
  
  public isInvincible: boolean = false;
  private invincibilityTicks: number = 0;
  
  public onGround: boolean = false;
  private jumpPressed: boolean = false;
  private attackPressed: boolean = false;
  private airJumpsUsed: number = 0;
  private maxAirJumps: number = 1; // Allows 1 double jump
  
  private runFrame: number = 0;
  private facing: number = 1; // 1 = right, -1 = left

  constructor(x: number, y: number) {
    super(x, y, 14, 20); // Retro slim tall hitbox
  }

  public update(_map: GameMap, ticks: number) {
    // Decrease food/energy over time (Adventure Island style)
    if (this.food > 0) {
      this.food -= 0.05;
      if (this.food < 0) this.food = 0;
    } else {
      // Food depletion starves HP
      if (ticks % 120 === 0) {
        this.takeDamage(1);
      }
    }

    // Invincibility flashing timer
    if (this.isInvincible) {
      this.invincibilityTicks--;
      if (this.invincibilityTicks <= 0) {
        this.isInvincible = false;
      }
    }
  }

  public handleInput(
    keys: { isLeft: () => boolean; isRight: () => boolean; isJump: () => boolean; isAttack: () => boolean },
    map: GameMap,
    spawnAxe: (x: number, y: number, dir: number) => void,
    playAudio?: (type: 'jump') => void
  ) {
    this.hitCeiling = false;
    // Move left/right
    let moveDir = 0;
    if (keys.isLeft()) {
      moveDir = -1;
      this.facing = -1;
    }
    if (keys.isRight()) {
      moveDir = 1;
      this.facing = 1;
    }

    // Acceleration & Friction
    if (moveDir !== 0) {
      this.vx += moveDir * 0.35;
      if (this.vx > 2.5) this.vx = 2.5;
      if (this.vx < -2.5) this.vx = -2.5;
      
      // Update walk cycle animation frame
      this.runFrame += 0.2;
    } else {
      this.vx *= 0.8; // High friction
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
      this.runFrame = 0;
    }

    // Gravity
    this.vy += 0.35;
    if (this.vy > 7) this.vy = 7;

    // Jump key check
    const isJumpingKey = keys.isJump();
    if (isJumpingKey) {
      if (!this.jumpPressed) {
        this.jumpPressed = true;
        if (this.onGround) {
          this.vy = -6.5;
          this.onGround = false;
          if (playAudio) playAudio('jump');
        } else if (this.airJumpsUsed < this.maxAirJumps) {
          // Double jump
          this.vy = -5.8;
          this.airJumpsUsed++;
          if (playAudio) playAudio('jump');
        }
      }
    } else {
      this.jumpPressed = false;
      // Cut jump short if player releases button early (variable jump height)
      if (this.vy < -2) {
        this.vy = -2;
      }
    }

    // Attack key check
    if (keys.isAttack()) {
      if (!this.attackPressed) {
        this.attackPressed = true;
        // Throw axe forward
        const axeX = this.facing > 0 ? this.x + this.width : this.x - 8;
        spawnAxe(axeX, this.y + 4, this.facing);
      }
    } else {
      this.attackPressed = false;
    }

    // Apply movement & resolve tile collisions
    const res = Physics.moveWithMapCollision(this, map);
    
    if (res.onGround) {
      this.onGround = true;
      this.vy = 0;
      this.airJumpsUsed = 0; // Reset double jump
    } else {
      this.onGround = false;
    }

    this.hitCeiling = res.hitCeiling;
    if (res.hitCeiling) {
      this.vy = 0;
    }

    // Check boundary falling off bottom
    if (this.y > map.height) {
      this.takeDamage(this.hp); // Fall in pit is instant death
    }
  }

  public takeDamage(amt: number) {
    if (this.isInvincible) return;
    this.hp -= amt;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    } else {
      this.isInvincible = true;
      this.invincibilityTicks = 90; // Flash for 90 frames
      this.vy = -3; // Bounce up slightly when hurt
      this.vx = -this.facing * 1.5;
    }
  }

  public collectFood(amount: number) {
    this.food = Math.min(100, this.food + amount);
  }

  public addScore(amount: number) {
    this.score += amount;
  }

  public draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    // Flash if invincible
    if (this.isInvincible && Math.floor(this.invincibilityTicks / 4) % 2 === 0) {
      return; // Skip rendering frame for flashing effect
    }

    const rx = this.x - camX;
    const ry = this.y - camY;

    ctx.save();
    
    // Draw Cute Cyber-Neon Player
    // Mirror drawing depending on facing direction
    if (this.facing === -1) {
      ctx.translate(rx + this.width / 2, ry + this.height / 2);
      ctx.scale(-1, 1);
      ctx.translate(-(rx + this.width / 2), -(ry + this.height / 2));
    }

    // Body suit (Neon Blue/Purple)
    ctx.fillStyle = '#8b5cf6'; // Dark Purple body suit
    ctx.fillRect(rx + 2, ry + 6, 10, 10);
    
    // Running animation foot movement
    const animLegOffset = Math.floor(this.runFrame) % 3;
    ctx.fillStyle = '#00f0ff'; // Cyan shoes
    if (!this.onGround) {
      // In air legs
      ctx.fillRect(rx + 1, ry + 16, 3, 4);
      ctx.fillRect(rx + 10, ry + 16, 3, 2);
    } else if (animLegOffset === 1) {
      ctx.fillRect(rx + 2, ry + 16, 3, 4);
      ctx.fillRect(rx + 9, ry + 16, 3, 3);
    } else if (animLegOffset === 2) {
      ctx.fillRect(rx + 3, ry + 16, 3, 3);
      ctx.fillRect(rx + 8, ry + 16, 3, 4);
    } else {
      // Idle/standing legs
      ctx.fillRect(rx + 3, ry + 16, 3, 4);
      ctx.fillRect(rx + 8, ry + 16, 3, 4);
    }

    // Head / Cyber Helmet (White/Light grey)
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(rx + 3, ry, 8, 7);
    
    // Neon Red Visor
    ctx.fillStyle = '#ff3131';
    ctx.fillRect(rx + 7, ry + 2, 4, 2);

    // Glowing Neon belt/stripe
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(rx + 2, ry + 11, 10, 2);

    ctx.restore();
  }
}
