export interface LevelData {
  grid: string[];
  backgrounds: { color: string; speed: number; y: number; height: number; type: 'sky' | 'mountains' | 'clouds' }[];
  theme: {
    skyColor: string;
    groundColor: string;
    grassColor: string;
    brickColor: string;
  };
}

export class GameMap {
  public tileSize: number = 16;
  public cols: number = 0;
  public rows: number = 0;
  public width: number = 0;
  public height: number = 0;
  public grid: string[][] = [];
  
  public currentLevelIndex: number = 0;
  
  // High quality retro synthwave colors
  private levels: LevelData[] = [
    // Level 1: Neon Sunset Forest
    {
      theme: {
        skyColor: '#1a0b2e',
        groundColor: '#3d1259',
        grassColor: '#39ff14',
        brickColor: '#ff007f'
      },
      backgrounds: [
        { color: '#0d0518', speed: 0.1, y: 0, height: 320, type: 'sky' },
        { color: '#250b40', speed: 0.25, y: 120, height: 120, type: 'mountains' },
        { color: '#3d1259', speed: 0.5, y: 180, height: 80, type: 'clouds' }
      ],
      grid: [
        "................................................................................................................................",
        "................................................................................................................................",
        "................................................................................................................................",
        "...................F....................................F......................F..................F.............................",
        ".................###?#..................................###?#..................###?#..............###?#........................",
        "................................................................................................................................",
        "............................F...F....................................F..F..................F..F..................................",
        ".......#...#..............#######?##...............................#######?##..............#######?##...........................",
        "......###.###.........................................E................................................E........................",
        "....#.........#....E..................E......###....#####....X.X...............X.X....#####....#####....X.X..................G..",
        "#################################################################...############...#############################################",
        "#################################################################...############...#############################################",
        "#################################################################...############...#############################################",
        "#################################################################...############...#############################################",
        "#################################################################...############...#############################################",
        "#################################################################...############...#############################################",
        "#################################################################...############...#############################################",
        "#################################################################...############...#############################################",
        "#################################################################...############...#############################################",
        "#################################################################...############...#############################################"
      ]
    },
    // Level 2: Cyber Grid City
    {
      theme: {
        skyColor: '#050510',
        groundColor: '#0b1c3a',
        grassColor: '#00f0ff',
        brickColor: '#ffff00'
      },
      backgrounds: [
        { color: '#03030a', speed: 0.05, y: 0, height: 320, type: 'sky' },
        { color: '#0a1025', speed: 0.2, y: 80, height: 160, type: 'mountains' },
        { color: '#102045', speed: 0.4, y: 150, height: 100, type: 'clouds' }
      ],
      grid: [
        "................................................................................................................................",
        "................................................................................................................................",
        "...................................................B............................................................................",
        "............................F.............................F.....................F...................F...........................",
        "..........................###...........................###...................###...................###..........................",
        ".................B..............................................................................................................",
        "...............#####.......................F...F.....................F..F.................F..F..................................",
        ".........................................#########.................#########.............#########................................",
        "........E..............E..............................................................................E.........................",
        "....##..XX..##........###....X.X....E.......................X.X.X...............X.X.X................#####....X.X.X.X............G..",
        "#######################################...############...###########################...#########################################",
        "#######################################...############...###########################...#########################################",
        "#######################################...############...###########################...#########################################",
        "#######################################...############...###########################...#########################################",
        "#######################################...############...###########################...#########################################",
        "#######################################...############...###########################...#########################################",
        "#######################################...############...###########################...#########################################",
        "#######################################...############...###########################...#########################################",
        "#######################################...############...###########################...#########################################",
        "#######################################...############...###########################...#########################################"
      ]
    }
  ];

  constructor() {
    this.loadLevel(0);
  }

  public get maxLevels(): number {
    return this.levels.length;
  }

  public loadLevel(index: number) {
    this.currentLevelIndex = index;
    const lvl = this.levels[this.currentLevelIndex];
    this.rows = lvl.grid.length;
    this.cols = lvl.grid[0].length;
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;
    
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid.push(lvl.grid[r].split(''));
    }
  }

  public getLevelData(): LevelData {
    return this.levels[this.currentLevelIndex];
  }

  public getTile(col: number, row: number): string {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return '.';
    }
    return this.grid[row][col];
  }

  public setTile(col: number, row: number, val: string) {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      this.grid[row][col] = val;
    }
  }

  // Draw parallax backgrounds
  public drawBackground(ctx: CanvasRenderingContext2D, camX: number, screenWidth: number, screenHeight: number) {
    const lvl = this.getLevelData();
    
    lvl.backgrounds.forEach((bg) => {
      ctx.fillStyle = bg.color;
      
      // Sky is full background
      if (bg.type === 'sky') {
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        
        // Let's add cute pixel stars in sky
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 40; i++) {
          const starX = (Math.sin(i * 99) * 0.5 + 0.5) * screenWidth;
          const starY = (Math.cos(i * 45) * 0.5 + 0.5) * (screenHeight - 120);
          ctx.fillRect(starX, starY, 2, 2);
        }
        return;
      }
      
      // Scrolling background layers
      const offsetX = -(camX * bg.speed) % screenWidth;
      
      if (bg.type === 'mountains') {
        // Draw some retro mountain triangles/shapes
        ctx.beginPath();
        for (let x = -100; x < screenWidth + 200; x += 80) {
          const mountainX = x + offsetX;
          const h = bg.height + Math.sin(x * 0.05) * 20;
          ctx.moveTo(mountainX, screenHeight);
          ctx.lineTo(mountainX + 40, screenHeight - h);
          ctx.lineTo(mountainX + 80, screenHeight);
        }
        ctx.fill();
      } else if (bg.type === 'clouds') {
        // Draw some pixel cloud shapes
        ctx.beginPath();
        for (let x = -100; x < screenWidth + 200; x += 120) {
          const cloudX = x + offsetX;
          const cloudY = bg.y;
          ctx.fillRect(cloudX, cloudY, 60, 20);
          ctx.fillRect(cloudX + 10, cloudY - 8, 40, 8);
          ctx.fillRect(cloudX + 20, cloudY + 20, 20, 4);
        }
      }
    });
  }

  // Draw tilemap
  public drawTiles(ctx: CanvasRenderingContext2D, camX: number, camY: number, screenWidth: number, screenHeight: number) {
    const startCol = Math.floor(camX / this.tileSize);
    const endCol = Math.ceil((camX + screenWidth) / this.tileSize);
    const startRow = Math.floor(camY / this.tileSize);
    const endRow = Math.ceil((camY + screenHeight) / this.tileSize);
    
    const theme = this.getLevelData().theme;

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.getTile(c, r);
        if (tile === '.') continue;
        
        const x = c * this.tileSize - camX;
        const y = r * this.tileSize - camY;
        
        ctx.save();
        
        if (tile === '#') {
          // Ground Block
          // We distinguish top grass from dirt below
          const tileAbove = this.getTile(c, r - 1);
          if (tileAbove !== '#') {
            // Grass top
            ctx.fillStyle = theme.grassColor;
            ctx.fillRect(x, y, this.tileSize, 4);
            ctx.fillStyle = theme.groundColor;
            ctx.fillRect(x, y + 4, this.tileSize, this.tileSize - 4);
          } else {
            // Inner dirt block
            ctx.fillStyle = theme.groundColor;
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            
            // Add a little pixel grid detail
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
          }
        } 
        else if (tile === '?') {
          // Mystery/Coin Brick
          ctx.fillStyle = theme.brickColor;
          ctx.fillRect(x, y, this.tileSize, this.tileSize);
          
          // Draw border
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
          
          // Draw question mark or inner pattern
          ctx.fillStyle = '#fff';
          ctx.fillRect(x + 6, y + 4, 4, 2);
          ctx.fillRect(x + 8, y + 6, 2, 2);
          ctx.fillRect(x + 6, y + 8, 2, 2);
          ctx.fillRect(x + 7, y + 11, 2, 2);
        }
        else if (tile === 'X') {
          // Spike Block
          ctx.fillStyle = '#94a3b8'; // Metallic grey
          
          // Draw triangles
          ctx.beginPath();
          ctx.moveTo(x, y + this.tileSize);
          ctx.lineTo(x + 4, y + 4);
          ctx.lineTo(x + 8, y + this.tileSize);
          
          ctx.moveTo(x + 8, y + this.tileSize);
          ctx.lineTo(x + 12, y + 4);
          ctx.lineTo(x + 16, y + this.tileSize);
          ctx.fill();
        }
        else if (tile === 'G') {
          // Goal pole/flag
          ctx.fillStyle = '#facc15'; // Golden flag
          ctx.beginPath();
          ctx.moveTo(x + 4, y);
          ctx.lineTo(x + 14, y + 6);
          ctx.lineTo(x + 4, y + 12);
          ctx.closePath();
          ctx.fill();
          
          // Pole
          ctx.fillStyle = '#e4e4e7';
          ctx.fillRect(x + 2, y, 2, this.tileSize);
        }
        
        ctx.restore();
      }
    }
  }
}
