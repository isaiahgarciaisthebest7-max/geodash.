const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const progressBar = document.getElementById('progress-bar');

canvas.width = 800;
canvas.height = 400;

// Game State
let gameState = 'START';
let lastTime = 0;
let distance = 0;
let attempts = 1;
const levelLength = 10000;

const config = {
    gravity: 0.9,
    jumpForce: -13,
    shipForce: -0.8,
    speed: 400, // Pixels per second
    groundY: 350
};

const player = {
    x: 150, y: 300, size: 30, dy: 0, 
    mode: 'CUBE', rotation: 0,
    reset() {
        this.y = 300; this.dy = 0; this.rotation = 0; this.mode = 'CUBE';
    }
};

// Procedural Level Generation (No bugs with empty levels)
const obstacles = [];
for (let i = 1; i < 20; i++) {
    obstacles.push({ x: i * 600 + Math.random() * 200, type: 'SPIKE' });
    if (i % 5 === 0) obstacles.push({ x: i * 600 + 300, type: 'PORTAL_SHIP' });
    if (i % 8 === 0) obstacles.push({ x: i * 600 + 450, type: 'PORTAL_CUBE' });
}

let isPressing = false;
window.addEventListener('keydown', (e) => { if (e.code === 'Space') isPressing = true; });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') isPressing = false; });
canvas.addEventListener('mousedown', () => isPressing = true);
canvas.addEventListener('mouseup', () => isPressing = false);
overlay.addEventListener('click', () => { 
    overlay.style.display = 'none'; 
    gameState = 'PLAYING'; 
    requestAnimationFrame(gameLoop);
});

function checkCollision(p, o) {
    const ox = o.x - distance;
    // Tight hitboxes for "professional" feel
    const hitPadding = 5;
    if (p.x + p.size - hitPadding > ox && p.x + hitPadding < ox + 30) {
        if (o.type === 'SPIKE' && p.y + p.size - hitPadding > config.groundY - 30) return 'DIE';
        if (o.type === 'PORTAL_SHIP') return 'SHIP';
        if (o.type === 'PORTAL_CUBE') return 'CUBE';
    }
    return null;
}

function update(dt) {
    if (gameState !== 'PLAYING') return;

    distance += config.speed * dt;
    
    // Physics
    if (player.mode === 'CUBE') {
        player.dy += config.gravity;
        if (isPressing && player.y + player.size >= config.groundY) player.dy = config.jumpForce;
        player.rotation = (player.y + player.size < config.groundY) ? player.rotation + 360 * dt : 0;
    } else {
        player.dy += isPressing ? config.shipForce : config.gravity * 0.5;
        player.rotation = player.dy * 2;
    }

    player.y += player.dy;

    // Boundary Constraints
    if (player.y + player.size > config.groundY) {
        player.y = config.groundY - player.size;
        player.dy = 0;
    }
    if (player.y < 0) { player.y = 0; player.dy = 0; }

    // Obstacles & Portals
    obstacles.forEach(obs => {
        const result = checkCollision(player, obs);
        if (result === 'DIE') {
            attempts++;
            document.getElementById('attempt-text').innerText = `ATTEMPT ${attempts}`;
            distance = 0;
            player.reset();
        } else if (result === 'SHIP') player.mode = 'SHIP';
        else if (result === 'CUBE') player.mode = 'CUBE';
    });

    // Progress
    progressBar.style.width = Math.min((distance / levelLength) * 100, 100) + '%';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Background Grid (Classic GD Look)
    ctx.strokeStyle = '#002244';
    for (let i = 0; i < canvas.width; i += 40) {
        let off = -(distance % 40);
        ctx.beginPath(); ctx.moveTo(i + off, 0); ctx.lineTo(i + off, canvas.height); ctx.stroke();
    }

    // Draw Floor
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, config.groundY, canvas.width, 50);
    ctx.strokeStyle = '#00ffff';
    ctx.strokeRect(-1, config.groundY, canvas.width + 2, 2);

    // Draw Player
    ctx.save();
    ctx.translate(player.x + player.size/2, player.y + player.size/2);
    ctx.rotate(player.rotation * Math.PI / 180);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(-player.size/2, -player.size/2, player.size, player.size);
    ctx.strokeRect(-player.size/2, -player.size/2, player.size, player.size);
    ctx.restore();

    // Draw Obstacles
    obstacles.forEach(obs => {
        const ox = obs.x - distance;
        if (ox > -50 && ox < 850) {
            if (obs.type === 'SPIKE') {
                ctx.fillStyle = '#ff3333';
                ctx.beginPath();
                ctx.moveTo(ox, config.groundY);
                ctx.lineTo(ox + 15, config.groundY - 30);
                ctx.lineTo(ox + 30, config.groundY);
                ctx.fill();
            } else {
                ctx.fillStyle = obs.type === 'PORTAL_SHIP' ? '#ff00ff' : '#00ff00';
                ctx.fillRect(ox, 50, 10, 300);
            }
        }
    });
}

function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}
