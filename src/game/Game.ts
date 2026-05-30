import { GameMap } from './Map';
import { Camera } from './Camera';
import { Input } from './Input';
import { Player, Slime, Bat, Collectible, Axe, Entity } from './Entity';
import { Physics } from './Physics';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: Input;
  
  private map: GameMap;
  private camera: Camera;
  
  public player!: Player;
  private enemies: Entity[] = [];
  private collectibles: Collectible[] = [];
  private axes: Axe[] = [];
  private particles: Particle[] = [];
  
  private gameState: GameState = 'START';
  private currentLevel: number = 0;
  private ticks: number = 0;

  // HTML Overlay elements for UI bindings
  private startMenu: HTMLElement;
  private gameOverScreen: HTMLElement;
  private levelClearScreen: HTMLElement;
  private hudOverlay: HTMLElement;
  
  private hudHp: HTMLElement;
  private hudFoodBar: HTMLElement;
  private hudScore: HTMLElement;
  private hudLevel: HTMLElement;
  private finalScoreText: HTMLElement;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false; // Keep retro pixel sharpness
    
    this.input = new Input();
    this.map = new GameMap();
    this.camera = new Camera(this.canvas.width, this.canvas.height);

    // Fetch UI overlays
    this.startMenu = document.getElementById('start-menu')!;
    this.gameOverScreen = document.getElementById('game-over-screen')!;
    this.levelClearScreen = document.getElementById('level-clear-screen')!;
    this.hudOverlay = document.getElementById('game-hud')!;
    
    this.hudHp = document.getElementById('hud-hp')!;
    this.hudFoodBar = document.getElementById('hud-food-bar')!;
    this.hudScore = document.getElementById('hud-score')!;
    this.hudLevel = document.getElementById('hud-level')!;
    this.finalScoreText = document.getElementById('final-score')!;

    this.showState('START');
  }

  public startGame() {
    this.currentLevel = 0;
    this.ticks = 0;
    this.initLevel();
    this.showState('PLAYING');
  }

  public restartGame() {
    this.startGame();
  }

  public nextLevel() {
    if (this.currentLevel + 1 < this.map.maxLevels) {
      this.currentLevel++;
      this.initLevel();
      this.showState('PLAYING');
    } else {
      // Completed all levels!
      this.showState('START');
    }
  }

  private initLevel() {
    this.map.loadLevel(this.currentLevel);
    this.player = new Player(0, 0);
    this.enemies = [];
    this.collectibles = [];
    this.axes = [];
    this.particles = [];
    
    // Parse the map grid for spawn points
    for (let r = 0; r < this.map.rows; r++) {
      for (let c = 0; c < this.map.cols; c++) {
        const char = this.map.getTile(c, r);
        const pixelX = c * this.map.tileSize;
        const pixelY = r * this.map.tileSize;
        
        if (char === '#') {
          // If player is directly above, we spawn them there
          if (c === 2 && r === 8) {
            this.player.x = pixelX;
            this.player.y = pixelY - this.player.height;
          }
        } 
        else if (char === 'E') {
          // Slime spawn
          this.enemies.push(new Slime(pixelX, pixelY + 4));
          this.map.setTile(c, r, '.'); // Remove char so it's not rendered as brick
        } 
        else if (char === 'B') {
          // Bat spawn
          this.enemies.push(new Bat(pixelX, pixelY));
          this.map.setTile(c, r, '.');
        } 
        else if (char === 'F') {
          // Fruit spawn
          this.collectibles.push(new Collectible(pixelX + 2, pixelY + 2, 'fruit'));
          this.map.setTile(c, r, '.');
        } 
        else if (char === '?') {
          // Coin is inside mystery blocks, but we can also spawn coins openly
          // Keep it as '?' block so player can jump and hit it!
        }
      }
    }

    // Default player safety fallback position
    if (this.player.x === 0 && this.player.y === 0) {
      this.player.x = 32;
      this.player.y = 100;
    }
  }

  private showState(state: GameState) {
    this.gameState = state;
    
    this.startMenu.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.levelClearScreen.classList.add('hidden');
    this.hudOverlay.style.display = 'none';

    if (state === 'START') {
      this.startMenu.classList.remove('hidden');
    } else if (state === 'PLAYING') {
      this.hudOverlay.style.display = 'flex';
      this.updateHud();
    } else if (state === 'GAMEOVER') {
      this.gameOverScreen.classList.remove('hidden');
      this.finalScoreText.textContent = this.player.score.toString().padStart(6, '0');
    } else if (state === 'VICTORY') {
      this.levelClearScreen.classList.remove('hidden');
    }
  }

  private spawnParticles(x: number, y: number, color: string, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      const life = Math.random() * 20 + 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // Push upwards
        color,
        size: Math.random() * 3 + 1,
        life,
        maxLife: life
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += 0.1; // Mild gravity
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateHud() {
    // HP Hearts
    this.hudHp.textContent = '❤'.repeat(this.player.hp) + '🖤'.repeat(Math.max(0, 3 - this.player.hp));
    
    // Food/Energy Bar
    this.hudFoodBar.style.width = `${this.player.food}%`;
    
    // Color transitions based on energy level
    if (this.player.food > 50) {
      this.hudFoodBar.style.backgroundColor = '#39ff14'; // Neon Green
    } else if (this.player.food > 20) {
      this.hudFoodBar.style.backgroundColor = '#fff01f'; // Neon Yellow
    } else {
      this.hudFoodBar.style.backgroundColor = '#ff3131'; // Neon Red
    }

    // Score
    this.hudScore.textContent = this.player.score.toString().padStart(6, '0');
    
    // Level
    this.hudLevel.textContent = (this.currentLevel + 1).toString();
  }

  public update() {
    this.ticks++;
    if (this.gameState !== 'PLAYING') return;

    // 1. Update Player
    this.player.update(this.map, this.ticks);
    this.player.handleInput(this.input, this.map, (ax, ay, adir) => {
      this.axes.push(new Axe(ax, ay, adir));
      // Spark particle at throw position
      this.spawnParticles(ax, ay, '#00f0ff', 4);
    });

    // Death check
    if (this.player.isDead) {
      this.spawnParticles(this.player.x + 7, this.player.y + 10, '#ff3131', 20);
      this.showState('GAMEOVER');
      return;
    }

    // 2. Camera Tracking
    this.camera.update(this.player.x, this.player.y, this.map.width, this.map.height);

    // 3. Update Axes
    for (let i = this.axes.length - 1; i >= 0; i--) {
      const axe = this.axes[i];
      axe.update(this.map, this.ticks);
      if (axe.isDead) {
        this.axes.splice(i, 1);
      }
    }

    // 4. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.map, this.ticks);
      
      if (enemy.isDead) {
        this.enemies.splice(i, 1);
        continue;
      }

      // Check weapon hits on enemy
      for (let j = this.axes.length - 1; j >= 0; j--) {
        const axe = this.axes[j];
        if (Physics.checkIntersection(axe, enemy)) {
          // Hit! Kill enemy, destroy axe
          enemy.isDead = true;
          axe.isDead = true;
          this.player.addScore(200);
          this.spawnParticles(enemy.x + 8, enemy.y + 6, '#ec4899', 15);
          break;
        }
      }

      if (enemy.isDead) continue;

      // Check player stomping on enemy or getting hurt
      if (Physics.checkIntersection(this.player, enemy)) {
        // Did player fall on top of enemy? (Stomp)
        if (this.player.vy > 0.1 && this.player.y + this.player.height - this.player.vy <= enemy.y + 4) {
          enemy.isDead = true;
          this.player.vy = -4.5; // Bounce player up
          this.player.addScore(100);
          this.spawnParticles(enemy.x + 8, enemy.y + 6, '#10b981', 12);
        } else {
          // Player gets hit
          this.player.takeDamage(1);
          this.spawnParticles(this.player.x + 7, this.player.y + 10, '#ff3131', 8);
        }
      }
    }

    // 5. Update Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.update(this.map, this.ticks);
      
      if (Physics.checkIntersection(this.player, item)) {
        if (item.type === 'fruit') {
          this.player.collectFood(30); // Replenish energy
          this.player.addScore(50);
          this.spawnParticles(item.x + 6, item.y + 6, '#ef4444', 6);
        }
        this.collectibles.splice(i, 1);
      }
    }

    // 6. Check special tile hits (Spikes, mystery boxes, Goal)
    const pColLeft = Math.floor(this.player.x / this.map.tileSize);
    const pColRight = Math.floor((this.player.x + this.player.width - 0.1) / this.map.tileSize);
    const pRowTop = Math.floor(this.player.y / this.map.tileSize);
    const pRowBottom = Math.floor((this.player.y + this.player.height - 0.1) / this.map.tileSize);

    // Bottom check for spikes
    for (let c = pColLeft; c <= pColRight; c++) {
      for (let r = pRowTop; r <= pRowBottom; r++) {
        const tile = this.map.getTile(c, r);
        if (tile === 'X') {
          this.player.takeDamage(1);
        }
        else if (tile === 'G') {
          // Reached Goal flag!
          this.showState('VICTORY');
          return;
        }
      }
    }

    // Checking head-butt to Mystery blocks '?'
    if (this.player.hitCeiling) {
      const headY = Math.floor((this.player.y - 2) / this.map.tileSize);
      for (let c = pColLeft; c <= pColRight; c++) {
        if (this.map.getTile(c, headY) === '?') {
          // Break block / convert to standard brick
          this.map.setTile(c, headY, '#');
          
          // Spawn physical collectible (fruit or coin) above the block
          const itemX = c * this.map.tileSize + 2;
          const itemY = (headY - 1) * this.map.tileSize + 2;
          const type = Math.random() > 0.5 ? 'fruit' : 'coin';
          this.collectibles.push(new Collectible(itemX, itemY, type));
          
          // Spawn bouncing coin particle
          const coinX = c * this.map.tileSize + 8;
          const coinY = headY * this.map.tileSize - 8;
          this.spawnParticles(coinX, coinY, '#fbbf24', 12);
        }
      }
    }

    // 7. Particles
    this.updateParticles();

    // Sync HUD Elements
    this.updateHud();
  }

  public draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Parallax backgrounds
    this.map.drawBackground(this.ctx, this.camera.x, this.canvas.width, this.canvas.height);

    // Draw Map tiles
    this.map.drawTiles(this.ctx, this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);

    // Draw Collectibles
    this.collectibles.forEach(item => item.draw(this.ctx, this.camera.x, this.camera.y));

    // Draw Axes
    this.axes.forEach(axe => axe.draw(this.ctx, this.camera.x, this.camera.y));

    // Draw Enemies
    this.enemies.forEach(enemy => enemy.draw(this.ctx, this.camera.x, this.camera.y));

    // Draw Player
    if (this.gameState === 'PLAYING') {
      this.player.draw(this.ctx, this.camera.x, this.camera.y);
    }

    // Draw Particles
    this.particles.forEach((p) => {
      this.ctx.save();
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.ctx.fillRect(p.x - this.camera.x, p.y - this.camera.y, p.size, p.size);
      this.ctx.restore();
    });
  }
}
