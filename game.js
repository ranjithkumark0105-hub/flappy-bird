/**
 * Flappy Bird - Modern HTML5 Canvas Game
 * Clean, colorful, smooth 60fps physics, procedural audio & particles.
 */

// --- Audio Synthesizer (Web Audio API - No external assets required) ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playFlap() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      // Audio error fallback
    }
  }

  playScore() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [1046.5, 1318.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.18);
      });
    } catch (e) {}
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playFall() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

// --- Particle Effects (Feathers on crash, Sparkles on score) ---
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnFeathers(x, y) {
    const colors = ['#fbc531', '#e1b12c', '#fffa65', '#ffffff', '#e84118'];
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3
      });
    }
  }

  spawnSparkles(x, y) {
    const colors = ['#f9ca24', '#f6e58d', '#ffffff', '#badc58'];
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03,
        rotation: 0,
        vRot: 0
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity on particles
      p.rotation += p.vRot;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  reset() {
    this.particles = [];
  }
}

// --- Main Flappy Bird Game ---
class FlappyBirdGame {
  constructor() {
    // Canvas & Setup
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Logical Coordinate Space (Sharp scaling)
    this.GAME_WIDTH = 360;
    this.GAME_HEIGHT = 640;
    this.GROUND_HEIGHT = 90;

    // States
    this.STATE = {
      START: 'START',
      PLAYING: 'PLAYING',
      GAMEOVER: 'GAMEOVER'
    };
    this.currentState = this.STATE.START;

    // DOM Elements
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.hud = document.getElementById('hud');
    this.scoreDisplay = document.getElementById('score-display');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');
    this.medalIconEl = document.getElementById('medal-icon');
    this.newHighBadgeEl = document.getElementById('new-high-badge');
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.soundBtn = document.getElementById('sound-btn');
    this.soundIconOn = document.getElementById('sound-icon-on');
    this.soundIconOff = document.getElementById('sound-icon-off');

    // Audio & Particles
    this.sound = new SoundManager();
    this.particles = new ParticleSystem();

    // High Score from storage
    this.highScore = parseInt(localStorage.getItem('flappy_best_score') || '0', 10);

    // Physics & Game Constants
    this.gravity = 0.36;
    this.jumpStrength = -6.8;
    this.speed = 2.4;
    this.score = 0;
    this.gameTime = 0;
    this.screenShake = 0;

    // Background decoration offsets
    this.groundOffset = 0;
    this.clouds = [
      { x: 30, y: 70, speed: 0.35, scale: 0.9 },
      { x: 190, y: 120, speed: 0.25, scale: 0.7 },
      { x: 300, y: 50, speed: 0.45, scale: 1.1 }
    ];

    // Bird Object
    this.bird = {
      x: 85,
      y: 280,
      radius: 14,
      width: 34,
      height: 26,
      velocity: 0,
      rotation: 0,
      wingCycle: 0
    };

    // Pipes list
    this.pipes = [];
    this.pipeWidth = 58;
    this.pipeGap = 134;
    this.pipeSpawnTimer = 0;
    this.pipeSpawnInterval = 100; // frames

    this.resizeCanvas();
    this.bindEvents();
    this.resetGame();

    // Start Main Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resizeCanvas() {
    const container = document.getElementById('game-container');
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (rect.width > 0 && rect.height > 0) {
      this.GAME_HEIGHT = Math.round(this.GAME_WIDTH * (rect.height / rect.width));
    }

    this.canvas.width = Math.round(this.GAME_WIDTH * dpr);
    this.canvas.height = Math.round(this.GAME_HEIGHT * dpr);

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // Click / Touch input on container
    const container = document.getElementById('game-container');
    const handleInput = (e) => {
      // Don't intercept clicks on audio toggle
      if (e.target.closest('#sound-btn')) return;

      this.sound.init();

      if (this.currentState === this.STATE.GAMEOVER) {
        // If clicking on restart button or anywhere on game over overlay
        this.resetGame();
        this.startGame();
      } else {
        this.onAction();
      }
    };

    container.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      handleInput(e);
    });

    // Keyboard support (Space, ArrowUp, W, Enter)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') {
        e.preventDefault();
        this.sound.init();
        if (this.currentState === this.STATE.GAMEOVER) {
          this.resetGame();
          this.startGame();
        } else {
          this.onAction();
        }
      }
    });

    // Start Button
    this.startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.init();
      this.startGame();
    });

    // Restart Button
    this.restartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.init();
      this.resetGame();
      this.startGame();
    });

    // Sound toggle
    this.soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.init();
      const isMuted = this.sound.toggleMute();
      if (isMuted) {
        this.soundIconOn.classList.add('hidden');
        this.soundIconOff.classList.remove('hidden');
      } else {
        this.soundIconOn.classList.remove('hidden');
        this.soundIconOff.classList.add('hidden');
      }
    });
  }

  onAction() {
    if (this.currentState === this.STATE.START) {
      this.startGame();
    } else if (this.currentState === this.STATE.PLAYING) {
      this.flap();
    }
  }

  flap() {
    this.bird.velocity = this.jumpStrength;
    this.sound.playFlap();
  }

  startGame() {
    this.currentState = this.STATE.PLAYING;
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.scoreDisplay.textContent = '0';
    this.flap();
  }

  resetGame() {
    this.bird.x = 85;
    this.bird.y = Math.round(this.GAME_HEIGHT * 0.44);
    this.bird.velocity = 0;
    this.bird.rotation = 0;
    this.bird.wingCycle = 0;
    this.pipes = [];
    this.score = 0;
    this.pipeSpawnTimer = 30; // slight delay before first pipe
    this.particles.reset();
    this.screenShake = 0;
  }

  gameOver() {
    if (this.currentState === this.STATE.GAMEOVER) return;
    this.currentState = this.STATE.GAMEOVER;
    this.screenShake = 14;

    this.sound.playHit();
    setTimeout(() => this.sound.playFall(), 120);

    // Burst feathers where bird crashed
    this.particles.spawnFeathers(this.bird.x, this.bird.y);

    // Check high score
    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
      localStorage.setItem('flappy_best_score', this.highScore.toString());
    }

    // Populate Game Over screen
    this.finalScoreEl.textContent = this.score;
    this.bestScoreEl.textContent = this.highScore;

    // Medal assignment
    if (this.score >= 30) {
      this.medalIconEl.textContent = '🏆'; // Platinum / Trophy
    } else if (this.score >= 20) {
      this.medalIconEl.textContent = '🥇'; // Gold
    } else if (this.score >= 10) {
      this.medalIconEl.textContent = '🥈'; // Silver
    } else {
      this.medalIconEl.textContent = '🥉'; // Bronze
    }

    if (isNewHigh && this.score > 0) {
      this.newHighBadgeEl.classList.remove('hidden');
    } else {
      this.newHighBadgeEl.classList.add('hidden');
    }

    // Show Game Over card with slight delay for dramatic feel
    setTimeout(() => {
      this.hud.classList.add('hidden');
      this.gameOverScreen.classList.remove('hidden');
    }, 450);
  }

  update() {
    this.gameTime++;

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // Move clouds continuously
    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed;
      if (cloud.x + 80 < 0) {
        cloud.x = this.GAME_WIDTH + 40;
        cloud.y = 40 + Math.random() * 100;
      }
    }

    // Parallax ground offset
    if (this.currentState !== this.STATE.GAMEOVER) {
      this.groundOffset = (this.groundOffset + this.speed) % 24;
    }

    // STATE: START (idle bobbing)
    if (this.currentState === this.STATE.START) {
      this.bird.y = 270 + Math.sin(this.gameTime * 0.08) * 8;
      this.bird.rotation = Math.sin(this.gameTime * 0.08) * 0.08;
      this.bird.wingCycle = this.gameTime * 0.2;
      return;
    }

    // Particle updates
    this.particles.update();

    // STATE: PLAYING & GAMEOVER
    if (this.currentState === this.STATE.PLAYING || this.currentState === this.STATE.GAMEOVER) {
      // Physics
      this.bird.velocity += this.gravity;
      this.bird.y += this.bird.velocity;

      // Smooth rotation: nose up on jump, nose down on fall
      if (this.bird.velocity < 0) {
        this.bird.rotation = -0.38;
      } else {
        this.bird.rotation = Math.min(Math.PI / 2, this.bird.rotation + 0.06);
      }

      // Wing flapping speed based on velocity
      if (this.currentState === this.STATE.PLAYING) {
        this.bird.wingCycle += this.bird.velocity < 0 ? 0.45 : 0.18;
      }

      // Ground collision
      const groundY = this.GAME_HEIGHT - this.GROUND_HEIGHT;
      if (this.bird.y + this.bird.radius >= groundY) {
        this.bird.y = groundY - this.bird.radius;
        this.bird.velocity = 0;
        this.gameOver();
      }

      // Ceiling collision
      if (this.bird.y - this.bird.radius <= 0) {
        this.bird.y = this.bird.radius;
        this.bird.velocity = 0;
      }
    }

    // Pipes behavior (only while PLAYING)
    if (this.currentState === this.STATE.PLAYING) {
      this.pipeSpawnTimer++;
      if (this.pipeSpawnTimer >= this.pipeSpawnInterval) {
        this.pipeSpawnTimer = 0;
        this.spawnPipePair();
      }

      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const pipe = this.pipes[i];
        pipe.x -= this.speed;

        // Collision check
        if (this.checkCollision(this.bird, pipe)) {
          this.gameOver();
          break;
        }

        // Scoring trigger
        if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
          pipe.passed = true;
          this.score++;
          this.sound.playScore();
          this.scoreDisplay.textContent = this.score;

          // Score bump animation
          this.scoreDisplay.classList.remove('bump');
          void this.scoreDisplay.offsetWidth; // trigger reflow
          this.scoreDisplay.classList.add('bump');

          // Spawn celebration sparkles
          this.particles.spawnSparkles(this.bird.x + 10, this.bird.y);
        }

        // Remove off-screen pipes
        if (pipe.x + this.pipeWidth < -20) {
          this.pipes.splice(i, 1);
        }
      }
    }
  }

  spawnPipePair() {
    const minHeight = 60;
    const maxHeight = this.GAME_HEIGHT - this.GROUND_HEIGHT - this.pipeGap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    const bottomY = topHeight + this.pipeGap;
    const bottomHeight = this.GAME_HEIGHT - this.GROUND_HEIGHT - bottomY;

    this.pipes.push({
      x: this.GAME_WIDTH + 10,
      topHeight: topHeight,
      bottomY: bottomY,
      bottomHeight: bottomHeight,
      passed: false
    });
  }

  checkCollision(bird, pipe) {
    // Circle to Box collision helper
    const checkCircleBox = (cx, cy, cr, rx, ry, rw, rh) => {
      const closestX = Math.max(rx, Math.min(cx, rx + rw));
      const closestY = Math.max(ry, Math.min(cy, ry + rh));
      const distX = cx - closestX;
      const distY = cy - closestY;
      return (distX * distX + distY * distY) < (cr * cr);
    };

    // Buffer for slightly forgiving retro gameplay hitbox
    const r = bird.radius - 2;

    // Check Top Pipe
    if (checkCircleBox(bird.x, bird.y, r, pipe.x, 0, this.pipeWidth, pipe.topHeight)) {
      return true;
    }

    // Check Bottom Pipe
    if (checkCircleBox(bird.x, bird.y, r, pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight)) {
      return true;
    }

    return false;
  }

  // --- RENDERING ---
  draw() {
    this.ctx.save();

    // Screen Shake effect
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Sky & Sun
    this.drawSky();

    // 2. City Skyline / Hills background
    this.drawCitySkyline();

    // 3. Pipes
    this.drawPipes();

    // 4. Ground
    this.drawGround();

    // 5. Particles
    this.particles.draw(this.ctx);

    // 6. Bird
    this.drawBird();

    this.ctx.restore();
  }

  drawSky() {
    // Gradient sky
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.GAME_HEIGHT - this.GROUND_HEIGHT);
    skyGrad.addColorStop(0, '#4fc3f7');
    skyGrad.addColorStop(0.65, '#81d4fa');
    skyGrad.addColorStop(1, '#b3e5fc');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Distant warm sun
    const sunGrad = this.ctx.createRadialGradient(280, 100, 10, 280, 100, 60);
    sunGrad.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
    sunGrad.addColorStop(0.5, 'rgba(255, 243, 176, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(280, 100, 60, 0, Math.PI * 2);
    this.ctx.fill();

    // Fluffy Clouds
    for (const cloud of this.clouds) {
      this.drawCloud(cloud.x, cloud.y, cloud.scale);
    }
  }

  drawCloud(x, y, scale) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
    this.ctx.arc(16, -6, 22, 0, Math.PI * 2);
    this.ctx.arc(36, 0, 16, 0, Math.PI * 2);
    this.ctx.rect(-2, 0, 42, 14);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawCitySkyline() {
    const baseY = this.GAME_HEIGHT - this.GROUND_HEIGHT;
    this.ctx.fillStyle = '#a0e7e5';
    this.ctx.globalAlpha = 0.55;

    // Distant soft hills
    this.ctx.beginPath();
    this.ctx.arc(60, baseY + 60, 120, Math.PI, 0);
    this.ctx.arc(220, baseY + 80, 150, Math.PI, 0);
    this.ctx.arc(340, baseY + 50, 110, Math.PI, 0);
    this.ctx.fill();

    // Distant city silhouette
    this.ctx.fillStyle = '#89c4d9';
    this.ctx.globalAlpha = 0.7;
    const buildings = [
      { x: 10, w: 26, h: 65 },
      { x: 42, w: 32, h: 90 },
      { x: 80, w: 20, h: 50 },
      { x: 106, w: 36, h: 110 },
      { x: 148, w: 28, h: 70 },
      { x: 182, w: 40, h: 95 },
      { x: 230, w: 24, h: 60 },
      { x: 260, w: 35, h: 105 },
      { x: 302, w: 26, h: 75 },
      { x: 334, w: 30, h: 85 }
    ];

    for (const b of buildings) {
      this.ctx.fillRect(b.x, baseY - b.h, b.w, b.h);
      // Tiny building windows
      this.ctx.fillStyle = '#bce6f2';
      for (let wy = baseY - b.h + 8; wy < baseY - 10; wy += 14) {
        this.ctx.fillRect(b.x + 5, wy, 4, 6);
        if (b.w > 25) this.ctx.fillRect(b.x + b.w - 9, wy, 4, 6);
      }
      this.ctx.fillStyle = '#89c4d9';
    }

    this.ctx.globalAlpha = 1.0;
  }

  drawPipes() {
    for (const pipe of this.pipes) {
      // 1. Top Pipe
      this.drawSinglePipe(pipe.x, 0, this.pipeWidth, pipe.topHeight, true);

      // 2. Bottom Pipe
      this.drawSinglePipe(pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight, false);
    }
  }

  drawSinglePipe(x, y, width, height, isTop) {
    if (height <= 0) return;

    this.ctx.save();

    // Body Gradient
    const pipeGrad = this.ctx.createLinearGradient(x, 0, x + width, 0);
    pipeGrad.addColorStop(0, '#55efc4');
    pipeGrad.addColorStop(0.2, '#00b894');
    pipeGrad.addColorStop(0.7, '#00a382');
    pipeGrad.addColorStop(1, '#007058');

    this.ctx.fillStyle = pipeGrad;
    this.ctx.fillRect(x, y, width, height);

    // Pipe Border outline
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = '#004d3d';
    this.ctx.strokeRect(x, y, width, height);

    // Pipe Lip / Flange
    const lipHeight = 24;
    const lipOverhang = 4;
    const lipX = x - lipOverhang;
    const lipWidth = width + lipOverhang * 2;
    const lipY = isTop ? y + height - lipHeight : y;

    const lipGrad = this.ctx.createLinearGradient(lipX, 0, lipX + lipWidth, 0);
    lipGrad.addColorStop(0, '#55efc4');
    lipGrad.addColorStop(0.25, '#00b894');
    lipGrad.addColorStop(0.75, '#00a382');
    lipGrad.addColorStop(1, '#007058');

    this.ctx.fillStyle = lipGrad;
    this.ctx.beginPath();
    if (typeof this.ctx.roundRect === 'function') {
      this.ctx.roundRect(lipX, lipY, lipWidth, lipHeight, 3);
    } else {
      this.ctx.rect(lipX, lipY, lipWidth, lipHeight);
    }
    this.ctx.fill();
    this.ctx.stroke();

    // Specular Highlight line
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.fillRect(x + 6, y, 4, height);
    this.ctx.fillRect(lipX + 7, lipY + 2, 4, lipHeight - 4);

    this.ctx.restore();
  }

  drawGround() {
    const baseY = this.GAME_HEIGHT - this.GROUND_HEIGHT;

    // Grass Top Border
    this.ctx.fillStyle = '#2ed573';
    this.ctx.fillRect(0, baseY, this.GAME_WIDTH, 14);

    // Darker grass trim
    this.ctx.fillStyle = '#26af5f';
    this.ctx.fillRect(0, baseY + 14, this.GAME_WIDTH, 4);

    // Dirt base
    const dirtGrad = this.ctx.createLinearGradient(0, baseY + 18, 0, this.GAME_HEIGHT);
    dirtGrad.addColorStop(0, '#eccc68');
    dirtGrad.addColorStop(0.4, '#d8b44a');
    dirtGrad.addColorStop(1, '#b59231');
    this.ctx.fillStyle = dirtGrad;
    this.ctx.fillRect(0, baseY + 18, this.GAME_WIDTH, this.GROUND_HEIGHT - 18);

    // Ground scrolling retro stripes
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, baseY + 18, this.GAME_WIDTH, this.GROUND_HEIGHT - 18);
    this.ctx.clip();

    this.ctx.fillStyle = '#c8a339';
    for (let x = -this.groundOffset; x < this.GAME_WIDTH + 30; x += 24) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, baseY + 18);
      this.ctx.lineTo(x + 12, baseY + 18);
      this.ctx.lineTo(x, baseY + 42);
      this.ctx.lineTo(x - 12, baseY + 42);
      this.ctx.fill();
    }
    this.ctx.restore();

    // Top border divider line
    this.ctx.fillStyle = '#1e824c';
    this.ctx.fillRect(0, baseY, this.GAME_WIDTH, 2);
  }

  drawBird() {
    this.ctx.save();
    this.ctx.translate(this.bird.x, this.bird.y);
    this.ctx.rotate(this.bird.rotation);

    // 1. Bird Body (Golden yellow with gradient)
    const bodyGrad = this.ctx.createRadialGradient(-2, -3, 2, 0, 0, 16);
    bodyGrad.addColorStop(0, '#fff275');
    bodyGrad.addColorStop(0.7, '#fbc531');
    bodyGrad.addColorStop(1, '#e1b12c');

    this.ctx.fillStyle = bodyGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Body Outline
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#573c00';
    this.ctx.stroke();

    // 2. Cute Belly highlight
    this.ctx.fillStyle = '#fff7b0';
    this.ctx.beginPath();
    this.ctx.ellipse(2, 4, 10, 6, 0.2, 0, Math.PI * 2);
    this.ctx.fill();

    // 3. Rosy Cheek
    this.ctx.fillStyle = 'rgba(255, 107, 129, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(4, 3, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // 4. Animated Wing
    const wingOffset = Math.sin(this.bird.wingCycle) * 6;
    this.ctx.fillStyle = '#f5cd79';
    this.ctx.beginPath();
    this.ctx.ellipse(-7, -1 + wingOffset, 8, 5, -0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.lineWidth = 1.8;
    this.ctx.strokeStyle = '#7f5900';
    this.ctx.stroke();

    // 5. Large Cartoon Eye
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(7, -5, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = '#2f3542';
    this.ctx.stroke();

    // Pupil
    this.ctx.fillStyle = '#2f3542';
    this.ctx.beginPath();
    this.ctx.arc(9, -5, 2.8, 0, Math.PI * 2);
    this.ctx.fill();

    // Specular eye reflection dot
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(10, -6.5, 1.2, 0, Math.PI * 2);
    this.ctx.fill();

    // 6. Orange Beak
    this.ctx.fillStyle = '#ff6b4a';
    this.ctx.beginPath();
    this.ctx.moveTo(11, -2);
    this.ctx.lineTo(21, 1);
    this.ctx.lineTo(12, 6);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = '#573c00';
    this.ctx.stroke();

    // Beak middle smile line
    this.ctx.beginPath();
    this.ctx.moveTo(12, 1.5);
    this.ctx.lineTo(18, 1.5);
    this.ctx.stroke();

    this.ctx.restore();
  }

  // --- Main Animation Loop ---
  gameLoop(currentTime) {
    this.update();
    this.draw();
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Instantiate game on DOM content loaded
window.addEventListener('DOMContentLoaded', () => {
  new FlappyBirdGame();
});
