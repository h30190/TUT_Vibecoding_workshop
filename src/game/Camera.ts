export class Camera {
  public x: number = 0;
  public y: number = 0;
  public width: number;
  public height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public update(targetX: number, targetY: number, mapWidth: number, mapHeight: number) {
    // Keep target centered in x
    this.x = targetX - this.width / 2;
    // Bound camera to map edges
    if (this.x < 0) this.x = 0;
    if (this.x > mapWidth - this.width) this.x = mapWidth - this.width;

    // Keep camera relatively static or minor tracking in Y
    this.y = targetY - this.height * 0.65;
    if (this.y < 0) this.y = 0;
    if (this.y > mapHeight - this.height) this.y = mapHeight - this.height;
  }
}
