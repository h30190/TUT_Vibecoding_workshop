import './style.css';
import { Game } from './game/Game';

// Initialize the game
const game = new Game('game-canvas');

// Bind buttons
const startBtn = document.getElementById('start-button')!;
const restartBtn = document.getElementById('restart-button')!;
const nextLevelBtn = document.getElementById('next-level-button')!;

startBtn.addEventListener('click', () => {
  game.startGame();
});

restartBtn.addEventListener('click', () => {
  game.restartGame();
});

nextLevelBtn.addEventListener('click', () => {
  game.nextLevel();
});

// Sound Mute Toggle
const muteBtn = document.getElementById('hud-mute')!;
muteBtn.addEventListener('click', () => {
  const isMuted = game.sound.toggleMute();
  muteBtn.textContent = isMuted ? '🔇 MUTE' : '🔊 SOUND';
});

// Game loop
function loop() {
  game.update();
  game.draw();
  requestAnimationFrame(loop);
}

// Start the loop
requestAnimationFrame(loop);
