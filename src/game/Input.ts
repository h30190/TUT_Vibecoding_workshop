export class Input {
  public keys: { [key: string]: boolean } = {};

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      // Prevent scrolling when pressing Space or Arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  public isLeft(): boolean {
    return this.keys['KeyA'] || this.keys['ArrowLeft'];
  }

  public isRight(): boolean {
    return this.keys['KeyD'] || this.keys['ArrowRight'];
  }

  public isJump(): boolean {
    return this.keys['KeyK'] || this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space'];
  }

  public isAttack(): boolean {
    return this.keys['KeyJ'] || this.keys['KeyX'] || this.keys['ControlLeft'];
  }
}
