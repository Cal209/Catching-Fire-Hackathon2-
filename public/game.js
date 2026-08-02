const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
  playerX: canvas.width / 2,
  playerY: canvas.height - 80,
  coins: 0,
  score: 0,
  firesStopped: 0,
  isGameRunning: false,
  upgradeLevel: { water: 0, speed: 0, vision: 0 }
};

let fires = [];
let particles = [];
let gameTime = 0;

const player = {
  width: 40,
  height: 40,
  speed: 4,
  waterCapacity: 5,
  currentWater: 5,
  shooting: false
};

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  gameState.playerX = e.clientX - rect.left - player.width / 2;
  gameState.playerY = e.clientY - rect.top - player.height / 2;
  gameState.playerX = Math.max(0, Math.min(gameState.playerX, canvas.width - player.width));
  gameState.playerY = Math.max(0, Math.min(gameState.playerY, canvas.height - player.height));
});

canvas.addEventListener('click', () => {
  player.shooting = true;
});

canvas.addEventListener('mouseup', () => {
  player.shooting = false;
});

class Fire {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30 + Math.random() * 20;
    this.height = 30 + Math.random() * 20;
    this.health = 100;
    this.maxHealth = 100;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = -Math.random() * 1 - 0.5;
    this.spread = 0;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.spread += 0.5;
    
    if (Math.random() < 0.01 && this.spread > 30 && fires.length < 15) {
      fires.push(new Fire(
        this.x + (Math.random() - 0.5) * 80,
        this.y + (Math.random() - 0.5) * 80
      ));
    }
  }

  draw() {
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width / 2);
    gradient.addColorStop(0, `rgba(255, 100, 0, 0.8)`);
    gradient.addColorStop(1, `rgba(255, 200, 0, 0.2)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2 + Math.sin(gameTime * 0.1) * 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(this.x - this.width / 2, this.y - this.height, (this.health / this.maxHealth) * this.width, 3);
  }

  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }
}

class Particle {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.life -= 0.02;
  }

  draw() {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function spawnFire() {
  const x = Math.random() * (canvas.width - 100) + 50;
  const y = Math.random() * (canvas.height / 2) + 50;
  fires.push(new Fire(x, y));
}

function drawPlayer() {
  ctx.fillStyle = '#0066ff';
  ctx.fillRect(gameState.playerX, gameState.playerY, player.width, player.height);
  
  const waterPercentage = player.currentWater / player.waterCapacity;
  ctx.fillStyle = '#00ccff';
  ctx.fillRect(
    gameState.playerX + 2,
    gameState.playerY + player.height - 6,
    (player.width - 4) * waterPercentage,
    4
  );
  
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(gameState.playerX, gameState.playerY, player.width, player.height);
}

function shootWater() {
  if (player.currentWater <= 0) return;

  const spread = 3 + gameState.upgradeLevel.vision;
  for (let i = 0; i < spread; i++) {
    const angle = (Math.random() - 0.5) * 0.5;
    const vx = Math.sin(angle) * 5;
    const vy = -8 - Math.random() * 2;
    
    particles.push(new Particle(
      gameState.playerX + player.width / 2,
      gameState.playerY,
      vx,
      vy,
      '#00ccff'
    ));
  }
  
  player.currentWater -= 1;
}

function updateCollisions() {
  for (let pIdx = particles.length - 1; pIdx >= 0; pIdx--) {
    const particle = particles[pIdx];
    for (let fIdx = fires.length - 1; fIdx >= 0; fIdx--) {
      const fire = fires[fIdx];
      const dx = particle.x - fire.x;
      const dy = particle.y - fire.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < fire.width / 2 + 5) {
        particles.splice(pIdx, 1);
        if (fire.takeDamage(10)) {
          fires.splice(fIdx, 1);
          gameState.firesStopped++;
          gameState.coins += 10;
          gameState.score += 100;
          
          for (let i = 0; i < 10; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = Math.random() * 5 + 2;
            particles.push(new Particle(
              fire.x, fire.y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              '#ffaa00'
            ));
          }
        }
        break;
      }
    }
  }
}

function update() {
  gameTime++;

  if (player.shooting && player.currentWater > 0) {
    shootWater();
  } else if (player.currentWater < player.waterCapacity) {
    player.currentWater += 0.3;
    if (player.currentWater > player.waterCapacity) {
      player.currentWater = player.waterCapacity;
    }
  }

  fires.forEach(fire => fire.update());
  
  particles = particles.filter(p => {
    p.update();
    return p.life > 0;
  });

  updateCollisions();

  if (gameTime % 120 === 0 && fires.length < 5 + gameState.upgradeLevel.speed) {
    spawnFire();
  }

  gameState.score += fires.length;

  if (fires.length > 15) {
    endGame();
  }
}

function draw() {
  ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  fires.forEach(fire => fire.draw());
  particles.forEach(p => p.draw());
  drawPlayer();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`Water: ${Math.ceil(player.currentWater)}/${player.waterCapacity}`, 20, 30);
  ctx.fillText(`Fires: ${fires.length}`, 20, 55);
}

function gameLoop() {
  if (!gameState.isGameRunning) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function initGame() {
  gameState.isGameRunning = true;
  gameState.coins = 0;
  gameState.score = 0;
  gameState.firesStopped = 0;
  fires = [];
  particles = [];
  gameTime = 0;
  player.currentWater = player.waterCapacity;
  
  spawnFire();
  gameLoop();
}

function restartGame() {
  gameState.isGameRunning = false;
  setTimeout(() => {
    initGame();
  }, 100);
}

function endGame() {
  gameState.isGameRunning = false;
  submitGameScore();
}

async function submitGameScore() {
  try {
    const playerName = prompt('Enter your name:') || 'Anonymous';
    
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName,
        score: gameState.score,
        coinsEarned: gameState.coins,
        firefightsCompleted: gameState.firesStopped
      })
    });

    loadLeaderboard();
    alert(`🏆 Game Over!\nScore: ${gameState.score}\nCoins: ${gameState.coins}`);
  } catch (err) {
    console.error('Error:', err);
  }
}

function buyUpgrade(type) {
  const costs = { water: 50, speed: 75, vision: 100 };
  const cost = costs[type];

  if (gameState.coins < cost) {
    alert('Not enough coins!');
    return;
  }

  gameState.coins -= cost;
  gameState.upgradeLevel[type]++;
  
  if (type === 'water') {
    player.waterCapacity += 3;
    player.currentWater = player.waterCapacity;
  }

  document.getElementById(`cost-${type}`).textContent = cost * (gameState.upgradeLevel[type] + 1);
  updateHUD();
}

function updateHUD() {
  document.getElementById('coins-display').textContent = gameState.coins;
  document.getElementById('fires-stopped').textContent = gameState.firesStopped;
  document.getElementById('score-display').textContent = gameState.score;
}

setInterval(updateHUD, 100);
