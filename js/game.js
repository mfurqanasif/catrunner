// Sad Cat Runner - Main Game Logic
// A browser-based endless runner game featuring a sad meme cat

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GAME_SPEED_INITIAL = 5;
const GAME_SPEED_INCREMENT = 0.001;
const OBSTACLE_FREQUENCY_INITIAL = 1500; // ms between obstacles
const OBSTACLE_FREQUENCY_MIN = 800; // minimum ms between obstacles
const POWERUP_FREQUENCY = 10000; // ms between power-ups
const GROUND_HEIGHT = 30;
const JETPACK_DURATION = 5000; // 5 seconds
const MAGNET_DURATION = 7000; // 7 seconds
const INVISIBILITY_DURATION = 3000; // 3 seconds

// Game variables
let canvas, ctx;
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = 0;
let gameSpeed = GAME_SPEED_INITIAL;
let obstacleFrequency = OBSTACLE_FREQUENCY_INITIAL;
let lastObstacleTime = 0;
let lastPowerupTime = 0;
let groundY;
let muted = false;
let assetsLoaded = 0;
let totalAssets = 0;
let gameLoopStarted = false;

// Game objects
let cat = null; // Initialize as null to check before using
let obstacles = [];
let powerups = [];
let coins = [];
let activePowerups = {
    jetpack: false,
    magnet: false,
    invisibility: false
};
let powerupTimers = {
    jetpack: null,
    magnet: null,
    invisibility: null
};

// Assets
let assets = {
    images: {
        cat: null,
        catJump: null,
        catJetpack: null,
        catInvisible: null,
        background: null,
        errorMessage: null,
        redFlag: null,
        jetpackIcon: null,
        magnetIcon: null,
        invisibilityIcon: null,
        coin: null
    },
    sounds: {
        jump: null,
        collision: null,
        powerup: null,
        coin: null,
        backgroundMusic: null
    }
};

// Initialize the game
window.onload = function() {
    console.log('Window loaded');
    
    // Set up canvas
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context');
        return;
    }
    
    // Set canvas dimensions
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Calculate ground position
    groundY = canvas.height - GROUND_HEIGHT;
    
    // Draw initial loading screen
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '30px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Loading assets...', canvas.width / 2, canvas.height / 2);
    
    // Load assets
    loadAssets();
    
    // Set up event listeners
    setupEventListeners();
};

// Load all game assets
function loadAssets() {
    console.log('Loading assets');
    
    // Count total assets for loading progress
    totalAssets = Object.keys(assets.images).length - 1; // -1 because we're creating coin dynamically
    
    // Create a simple coin image since we don't have one
    const coinCanvas = document.createElement('canvas');
    const coinCtx = coinCanvas.getContext('2d');
    coinCanvas.width = 30;
    coinCanvas.height = 30;
    coinCtx.fillStyle = '#FFD700'; // Gold color
    coinCtx.beginPath();
    coinCtx.arc(15, 15, 12, 0, Math.PI * 2);
    coinCtx.fill();
    coinCtx.strokeStyle = '#DAA520'; // Darker gold
    coinCtx.lineWidth = 2;
    coinCtx.stroke();
    coinCtx.fillStyle = '#DAA520';
    coinCtx.font = 'bold 16px Arial';
    coinCtx.textAlign = 'center';
    coinCtx.textBaseline = 'middle';
    coinCtx.fillText('$', 15, 15);
    
    // Convert canvas to data URL
    const coinDataURL = coinCanvas.toDataURL();
    
    // Load images with onload handlers
    function loadImage(key, src) {
        console.log(`Loading image: ${key} from ${src}`);
        assets.images[key] = new Image();
        assets.images[key].onload = function() {
            console.log(`Image loaded: ${key}`);
            assetsLoaded++;
            updateLoadingProgress();
            checkAllAssetsLoaded();
        };
        assets.images[key].onerror = function() {
            console.error(`Failed to load image: ${src}`);
            // Still count as loaded to prevent hanging
            assetsLoaded++;
            updateLoadingProgress();
            checkAllAssetsLoaded();
        };
        assets.images[key].src = src;
    }
    
    // Load all images
    loadImage('cat', 'assets/images/crying_cat_reference.gif');
    loadImage('catJump', 'assets/images/crying_cat_reference.gif');
    loadImage('catJetpack', 'assets/images/crying_cat_reference.gif');
    loadImage('catInvisible', 'assets/images/crying_cat_reference.gif');
    loadImage('background', 'assets/images/dark_alley_background.jpeg');
    loadImage('errorMessage', 'assets/images/error_message_icon.png');
    loadImage('redFlag', 'assets/images/red_flag_icon.png');
    loadImage('jetpackIcon', 'assets/images/jetpack_icon.png');
    loadImage('magnetIcon', 'assets/images/magnet_icon.png');
    loadImage('invisibilityIcon', 'assets/images/invisibility_icon.png');
    
    // Load coin from data URL
    assets.images.coin = new Image();
    assets.images.coin.onload = function() {
        console.log('Coin image created and loaded');
    };
    assets.images.coin.src = coinDataURL;
    
    // Load sounds - don't count these in the loading progress
    try {
        assets.sounds.jump = new Audio('assets/sounds/jump.mp3');
        assets.sounds.collision = new Audio('assets/sounds/collision.mp3');
        assets.sounds.powerup = new Audio('assets/sounds/powerup.mp3');
        assets.sounds.coin = new Audio('assets/sounds/collision.mp3'); // Reusing collision sound for now
        assets.sounds.backgroundMusic = new Audio('assets/sounds/background-music.mp3');
        assets.sounds.backgroundMusic.loop = true;
        
        // Preload audio
        assets.sounds.jump.load();
        assets.sounds.collision.load();
        assets.sounds.powerup.load();
        assets.sounds.backgroundMusic.load();
    } catch (e) {
        console.error('Error loading audio:', e);
    }
}

// Update loading progress
function updateLoadingProgress() {
    const loadingBar = document.getElementById('loading-bar');
    if (loadingBar) {
        const progress = (assetsLoaded / totalAssets) * 100;
        loadingBar.style.width = progress + '%';
    }
    
    // Update loading text on canvas
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '30px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`Loading assets... ${Math.floor((assetsLoaded / totalAssets) * 100)}%`, canvas.width / 2, canvas.height / 2);
}

// Check if all assets are loaded
function checkAllAssetsLoaded() {
    console.log(`Assets loaded: ${assetsLoaded}/${totalAssets}`);
    if (assetsLoaded >= totalAssets && !gameLoopStarted) {
        console.log('All assets loaded, starting game loop');
        gameLoopStarted = true;
        
        // Initialize cat object here to ensure it exists before game loop starts
        cat = {
            x: 100,
            y: groundY - 60, // Position cat above ground
            width: 60,
            height: 60,
            velocityY: 0,
            jumping: false,
            animation: 'running',
            frame: 0,
            frameTimer: 0,
            frameInterval: 100 // ms per frame
        };
        
        // Draw ready screen on canvas
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '30px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Ready! Press Start to play', canvas.width / 2, canvas.height / 2);
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }
}

// Set up event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Keyboard controls
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            if (!gameStarted) {
                startGame();
            } else if (!gameOver) {
                jump();
            } else {
                resetGame();
            }
            event.preventDefault();
        }
        
        if (event.code === 'KeyP') {
            togglePause();
        }
        
        // Colorblind mode toggle
        if (event.code === 'KeyC') toggleColorblind();
    });
    
    // Touch controls for mobile
    if (canvas) {
        canvas.addEventListener('touchstart', function(event) {
            if (!gameStarted) {
                startGame();
            } else if (!gameOver) {
                jump();
            } else {
                resetGame();
            }
            event.preventDefault();
        });
    }
    
    // Mute button
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
        muteButton.addEventListener('click', toggleMute);
    }
    
    const muteButtonGame = document.getElementById('mute-button-game');
    if (muteButtonGame) {
        muteButtonGame.addEventListener('click', toggleMute);
    }
    
    // Start button
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
    
    // Restart button
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.addEventListener('click', resetGame);
    }
    
    // Share button
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', shareScore);
    }
    
    // Jump button for mobile
    const jumpButton = document.getElementById('jump-button');
    if (jumpButton) {
        jumpButton.addEventListener('touchstart', function(event) {
            if (gameStarted && !gameOver) {
                jump();
                event.preventDefault();
            }
        });
    }
    
    // Accessibility: keyboard navigation for replay/share
    window.addEventListener('DOMContentLoaded', function() {
        const restartBtn = document.getElementById('restart-button');
        const shareBtn = document.getElementById('share-button');
        if (restartBtn) restartBtn.tabIndex = 0;
        if (shareBtn) shareBtn.tabIndex = 0;
    });
    
    // Local leaderboard (top 5)
    window.addEventListener('DOMContentLoaded', function() {
        let lbBtn = document.getElementById('leaderboard-button');
        if (!lbBtn) {
            lbBtn = document.createElement('button');
            lbBtn.id = 'leaderboard-button';
            lbBtn.className = 'button';
            lbBtn.textContent = '🏆';
            document.body.appendChild(lbBtn);
        }
        lbBtn.onclick = showLeaderboard;
    });
    
    // Enhanced sharing: WhatsApp (share link)
    window.addEventListener('DOMContentLoaded', function() {
        let waBtn = document.getElementById('share-whatsapp');
        if (!waBtn) {
            waBtn = document.createElement('div');
            waBtn.id = 'share-whatsapp';
            waBtn.className = 'share-option';
            waBtn.textContent = '🟢';
            document.querySelector('.share-options')?.appendChild(waBtn);
        }
        waBtn.onclick = function() {
            const url = encodeURIComponent(window.location.href);
            const msg = encodeURIComponent('Try to beat my score in Sad Cat Runner!');
            window.open(`https://wa.me/?text=${msg}%20${url}`,'_blank');
        };
    });
    
    // Show high score on start/game over screens
    window.addEventListener('DOMContentLoaded', function() {
        const hsEls = document.querySelectorAll('.high-score');
        loadHighScore();
        hsEls.forEach(el => el.textContent = highScore);
    });
}

// Load high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('sadCatRunnerHighScore');
    highScore = saved ? parseInt(saved, 10) : 0;
}

// Save high score to localStorage
function saveHighScore() {
    localStorage.setItem('sadCatRunnerHighScore', highScore);
}

// Update localStorage with the current score
function updateLocalStorageScore(score) {
    let scores = JSON.parse(localStorage.getItem('sadCatRunnerLeaderboard') || '[]');
    scores.push(score);
    localStorage.setItem('sadCatRunnerLeaderboard', JSON.stringify(scores));
}

// Toggle pause/resume
let paused = false;
function togglePause() {
    paused = !paused;
    if (paused) {
        if (assets.sounds.backgroundMusic) assets.sounds.backgroundMusic.pause();
    } else {
        if (!muted && assets.sounds.backgroundMusic && gameStarted && !gameOver) {
            assets.sounds.backgroundMusic.play();
        }
    }
}

// Start the game
function startGame() {
    console.log('Starting game');
    
    // Check if assets are loaded
    if (assetsLoaded < totalAssets) {
        console.log('Assets still loading, cannot start game yet');
        return;
    }
    
    // Check if cat is initialized
    if (!cat) {
        console.error('Cat not initialized');
        // Initialize cat as fallback
        cat = {
            x: 100,
            y: groundY - 60,
            width: 60,
            height: 60,
            velocityY: 0,
            jumping: false,
            animation: 'running',
            frame: 0,
            frameTimer: 0,
            frameInterval: 100 // ms per frame
        };
    }
    
    // Hide start screen, show game screen
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    
    if (startScreen && gameScreen) {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
    } else {
        console.error('Start or game screen elements not found');
    }
    
    // Reset game variables
    gameStarted = true;
    gameOver = false;
    score = 0;
    gameSpeed = GAME_SPEED_INITIAL;
    obstacleFrequency = OBSTACLE_FREQUENCY_INITIAL;
    obstacles = [];
    powerups = [];
    coins = [];
    lastObstacleTime = 0;
    lastPowerupTime = 0;
    
    // Reset active powerups
    activePowerups.jetpack = false;
    activePowerups.magnet = false;
    activePowerups.invisibility = false;
    
    // Clear any existing powerup timers
    clearTimeout(powerupTimers.jetpack);
    clearTimeout(powerupTimers.magnet);
    clearTimeout(powerupTimers.invisibility);
    
    // Play background music
    if (!muted && assets.sounds.backgroundMusic) {
        try {
            assets.sounds.backgroundMusic.currentTime = 0;
            const playPromise = assets.sounds.backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error('Error playing music:', e);
                });
            }
        } catch (e) {
            console.error('Error playing background music:', e);
        }
    }
    
    // Update score display
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = '0';
    }
    
    console.log('Game started, cat position:', cat.x, cat.y);
}

// Make the cat jump
function jump() {
    if (!cat) {
        console.error('Cat not initialized');
        return;
    }
    
    if (!cat.jumping || activePowerups.jetpack) {
        cat.velocityY = JUMP_FORCE;
        cat.jumping = true;
        
        // Play jump sound
        if (!muted && assets.sounds.jump) {
            try {
                assets.sounds.jump.currentTime = 0;
                const playPromise = assets.sounds.jump.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.error('Error playing jump sound:', e);
                    });
                }
            } catch (e) {
                console.error('Error playing jump sound:', e);
            }
        }
    }
}

// Toggle mute state
function toggleMute() {
    muted = !muted;
    
    // Update mute button text
    const muteButton = document.getElementById('mute-button');
    const muteButtonGame = document.getElementById('mute-button-game');
    
    if (muteButton) {
        muteButton.textContent = muted ? '🔇' : '🔊';
    }
    
    if (muteButtonGame) {
        muteButtonGame.textContent = muted ? '🔇' : '🔊';
    }
    
    // Mute/unmute background music
    if (assets.sounds.backgroundMusic) {
        if (muted) {
            assets.sounds.backgroundMusic.pause();
        } else if (gameStarted && !gameOver) {
            try {
                const playPromise = assets.sounds.backgroundMusic.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.error('Error playing music:', e);
                    });
                }
            } catch (e) {
                console.error('Error playing background music:', e);
            }
        }
    }
}

// Use window-scoped variable to avoid redeclaration
window.sadCatColorblindMode = window.sadCatColorblindMode || false;
function toggleColorblind() {
    window.sadCatColorblindMode = !window.sadCatColorblindMode;
    document.body.classList.toggle('colorblind', window.sadCatColorblindMode);
}
document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyC') toggleColorblind();
});

// Share score as a meme
function shareScore() {
    // Generate meme message based on score
    const memeMessages = [
        `You ran from ${score} red flags — Still single tho`,
        `Dodged ${score} responsibilities — You're a legend`,
        `Survived the bill avalanche — Wallet says 'why?'`,
        "Life gave you lemons. You ran.",
        "You're faster than your motivation."
    ];
    
    // Select a random message
    const randomIndex = Math.floor(Math.random() * memeMessages.length);
    const memeMessage = memeMessages[randomIndex];
    
    // Display the meme message
    const memeMessageElement = document.getElementById('meme-message');
    if (memeMessageElement) {
        memeMessageElement.textContent = memeMessage;
    }
    
    // Generate meme using meme-generator.js
    if (typeof generateMeme === 'function') {
        generateMeme(score);
    } else {
        console.error('Meme generator function not found');
        alert(`Share your score: ${memeMessage}`);
    }
}

// --- PARTICLE SYSTEM ---
let particles = [];

function spawnParticles(x, y, color = '#FFD700', count = 12, type = 'coin') {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 1.2) * 3,
            alpha: 1,
            size: type === 'coin' ? 6 : 8,
            color: color,
            type: type
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.alpha -= 0.03;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        if (p.type === 'coin') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
        ctx.restore();
    });
}

// Create a new obstacle
function createObstacle() {
    const obstacleTypes = ['errorMessage', 'redFlag'];
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    
    let image;
    let width, height;
    
    if (type === 'errorMessage') {
        image = assets.images.errorMessage;
        width = 50;
        height = 50;
    } else {
        image = assets.images.redFlag;
        width = 40;
        height = 60;
    }
    
    const obstacle = {
        x: canvas.width,
        y: groundY - height,
        width: width,
        height: height,
        type: type,
        image: image
    };
    
    obstacles.push(obstacle);
}

// Create a new power-up
function createPowerup() {
    const powerupTypes = ['jetpack', 'magnet', 'invisibility'];
    const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    let image;
    
    if (type === 'jetpack') {
        image = assets.images.jetpackIcon;
    } else if (type === 'magnet') {
        image = assets.images.magnetIcon;
    } else {
        image = assets.images.invisibilityIcon;
    }
    
    const powerup = {
        x: canvas.width,
        y: groundY - 100 - Math.random() * 100, // Random height
        width: 40,
        height: 40,
        type: type,
        image: image
    };
    
    powerups.push(powerup);
}

// Create a new coin
function createCoin() {
    const coin = {
        x: canvas.width,
        y: groundY - 50 - Math.random() * 100, // Random height
        width: 30,
        height: 30,
        image: assets.images.coin
    };
    
    coins.push(coin);
}

// Activate a power-up
function activatePowerup(type) {
    // Play power-up sound
    if (!muted && assets.sounds.powerup) {
        try {
            assets.sounds.powerup.currentTime = 0;
            const playPromise = assets.sounds.powerup.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error('Error playing powerup sound:', e);
                });
            }
        } catch (e) {
            console.error('Error playing powerup sound:', e);
        }
    }
    
    // Set power-up as active
    activePowerups[type] = true;
    
    // Update cat image based on power-up
    if (cat) {
        if (type === 'jetpack') {
            cat.image = assets.images.catJetpack;
            // Make cat fly up
            cat.velocityY = JUMP_FORCE * 0.5;
        } else if (type === 'invisibility') {
            cat.image = assets.images.catInvisible;
        }
    }
    
    // Clear any existing timer for this power-up
    clearTimeout(powerupTimers[type]);
    
    // Set timer to deactivate power-up
    let duration;
    if (type === 'jetpack') {
        duration = JETPACK_DURATION;
    } else if (type === 'magnet') {
        duration = MAGNET_DURATION;
    } else {
        duration = INVISIBILITY_DURATION;
    }
    
    powerupTimers[type] = setTimeout(() => {
        deactivatePowerup(type);
    }, duration);
}

// Deactivate a power-up
function deactivatePowerup(type) {
    activePowerups[type] = false;
    
    // Reset cat image if no power-ups are active
    if (cat && !activePowerups.jetpack && !activePowerups.invisibility) {
        cat.image = cat.jumping ? assets.images.catJump : assets.images.cat;
    }
}

// Check for collisions
function checkCollisions() {
    if (!cat) return;
    
    // Check obstacle collisions
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        
        // Skip collision check if invisibility is active
        if (activePowerups.invisibility) continue;
        
        // Simple rectangle collision detection
        if (
            cat.x < obstacle.x + obstacle.width &&
            cat.x + cat.width > obstacle.x &&
            cat.y < obstacle.y + obstacle.height &&
            cat.y + cat.height > obstacle.y
        ) {
            // Collision detected
            gameOver = true;
            
            // Play collision sound
            if (!muted && assets.sounds.collision) {
                try {
                    assets.sounds.collision.currentTime = 0;
                    const playPromise = assets.sounds.collision.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.catch(e => {
                            console.error('Error playing collision sound:', e);
                        });
                    }
                    
                    if (assets.sounds.backgroundMusic) {
                        assets.sounds.backgroundMusic.pause();
                    }
                } catch (e) {
                    console.error('Error playing collision sound:', e);
                }
            }
            
            // Show game over screen
            setTimeout(() => {
                const gameScreen = document.getElementById('game-screen');
                const gameOverScreen = document.getElementById('game-over-screen');
                const finalScore = document.getElementById('final-score');
                
                if (gameScreen && gameOverScreen) {
                    gameScreen.classList.add('hidden');
                    gameOverScreen.classList.remove('hidden');
                    
                    if (finalScore) {
                        finalScore.textContent = score;
                    }
                    
                    // Update high score
                    if (score > highScore) {
                        highScore = score;
                        saveHighScore();
                        updateLeaderboard(score);
                    }
                    
                    // Generate meme message
                    const memeMessages = [
                        `You ran from ${score} red flags — Still single tho`,
                        `Dodged ${score} responsibilities — You're a legend`,
                        `Survived the bill avalanche — Wallet says 'why?'`,
                        "Life gave you lemons. You ran.",
                        "You're faster than your motivation."
                    ];
                    
                    // Select a random message
                    const randomIndex = Math.floor(Math.random() * memeMessages.length);
                    const memeMessage = memeMessages[randomIndex];
                    
                    // Display the meme message
                    const memeMessageElement = document.getElementById('meme-message');
                    if (memeMessageElement) {
                        memeMessageElement.textContent = memeMessage;
                    }
                    
                    // Generate meme
                    if (typeof generateMeme === 'function') {
                        generateMeme(score);
                    }
                } else {
                    console.error('Game screen or game over screen elements not found');
                }
            }, 1000);
            
            return;
        }
    }
    
    // Check power-up collisions
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        // Simple rectangle collision detection
        if (
            cat.x < powerup.x + powerup.width &&
            cat.x + cat.width > powerup.x &&
            cat.y < powerup.y + powerup.height &&
            cat.y + cat.height > powerup.y
        ) {
            // Collision detected, activate power-up
            activatePowerup(powerup.type);
            
            // Remove power-up
            powerups.splice(i, 1);
        }
    }
    
    // Check coin collisions
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        
        // Check if magnet is active
        if (activePowerups.magnet) {
            // Move coin towards cat
            const dx = cat.x - coin.x;
            const dy = cat.y - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                coin.x += dx * 0.1;
                coin.y += dy * 0.1;
            }
        }
        
        // Simple rectangle collision detection
        if (
            cat.x < coin.x + coin.width &&
            cat.x + cat.width > coin.x &&
            cat.y < coin.y + coin.height &&
            cat.y + cat.height > coin.y
        ) {
            // Collision detected, collect coin
            score += 10;
            spawnParticles(coin.x + coin.width/2, coin.y + coin.height/2, '#FFD700', 10, 'coin');
            
            // Play coin sound
            if (!muted && assets.sounds.coin) {
                try {
                    assets.sounds.coin.currentTime = 0;
                    const playPromise = assets.sounds.coin.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.catch(e => {
                            console.error('Error playing coin sound:', e);
                        });
                    }
                } catch (e) {
                    console.error('Error playing coin sound:', e);
                }
            }
            
            // Remove coin
            coins.splice(i, 1);
        }
    }
}

// Update game state
function update(timestamp) {
    if (!gameStarted || gameOver || !cat) return;
    
    // Update score
    score++;
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    // Increase game speed over time
    gameSpeed += GAME_SPEED_INCREMENT;
    
    // Decrease obstacle frequency over time (make it harder)
    obstacleFrequency = Math.max(OBSTACLE_FREQUENCY_MIN, obstacleFrequency - 0.1);
    
    // Update cat position
    if (activePowerups.jetpack) {
        // Jetpack makes cat fly up
        cat.velocityY = Math.min(cat.velocityY, -2);
    } else {
        // Apply gravity
        cat.velocityY += GRAVITY;
    }
    
    cat.y += cat.velocityY;
    
    // Keep cat above ground
    if (cat.y >= groundY - cat.height) {
        cat.y = groundY - cat.height;
        cat.velocityY = 0;
        cat.jumping = false;
        
        // Update cat image if not using a power-up
        if (!activePowerups.jetpack && !activePowerups.invisibility) {
            cat.image = assets.images.cat;
        }
    }
    
    // Create new obstacles
    if (timestamp - lastObstacleTime > obstacleFrequency) {
        createObstacle();
        lastObstacleTime = timestamp;
        
        // Randomly create coins
        if (Math.random() < 0.5) {
            createCoin();
        }
    }
    
    // Create new power-ups
    if (timestamp - lastPowerupTime > POWERUP_FREQUENCY) {
        createPowerup();
        lastPowerupTime = timestamp;
    }
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // Remove obstacles that are off-screen
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
    
    // Update power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].x -= gameSpeed;
        
        // Remove power-ups that are off-screen
        if (powerups[i].x + powerups[i].width < 0) {
            powerups.splice(i, 1);
        }
    }
    
    // Update coins
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].x -= gameSpeed;
        
        // Remove coins that are off-screen
        if (coins[i].x + coins[i].width < 0) {
            coins.splice(i, 1);
        }
    }
    
    // Update cat animation state and frame
    if (activePowerups.jetpack) {
        cat.animation = 'jetpack';
    } else if (activePowerups.invisibility) {
        cat.animation = 'invisibility';
    } else if (cat.jumping) {
        cat.animation = 'jumping';
    } else {
        cat.animation = 'running';
    }
    
    updateParticles();
    
    // Check for collisions
    checkCollisions();
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    if (assets.images.background) {
        ctx.drawImage(assets.images.background, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback background
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, groundY, canvas.width, GROUND_HEIGHT);
    
    // If game hasn't started, don't draw game objects
    if (!gameStarted) return;
    
    // Draw cat
    if (cat) {
        let catSprite = cat.image; // Always use the default cat image
        if (catSprite && catSprite.complete && catSprite.naturalWidth > 0) {
            ctx.save();
            // Add a soft drop shadow for visual polish
            ctx.shadowColor = '#222';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 8;
            // Fade effect for power-up states
            if (cat.animation === 'jetpack' || cat.animation === 'invisibility') {
                ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 200);
            } else {
                ctx.globalAlpha = 1.0;
            }
            ctx.drawImage(
                catSprite,
                cat.x, cat.y, cat.width, cat.height
            );
            ctx.restore();
        } else {
            // Draw a placeholder if cat image is missing
            ctx.save();
            ctx.fillStyle = 'pink';
            ctx.shadowColor = '#222';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 8;
            ctx.fillRect(cat.x, cat.y, cat.width, cat.height);
            ctx.restore();
        }
    }
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
        if (obstacle && obstacle.image) {
            ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else if (obstacle) {
            // Draw placeholder if image is missing
            ctx.fillStyle = 'red';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    });
    
    // Draw power-ups
    powerups.forEach(powerup => {
        if (powerup && powerup.image) {
            ctx.drawImage(powerup.image, powerup.x, powerup.y, powerup.width, powerup.height);
        } else if (powerup) {
            // Draw placeholder if image is missing
            ctx.fillStyle = 'yellow';
            ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
        }
    });
    
    // Draw coins
    coins.forEach(coin => {
        if (coin && coin.image) {
            ctx.drawImage(coin.image, coin.x, coin.y, coin.width, coin.height);
        } else if (coin) {
            // Draw placeholder if image is missing
            ctx.fillStyle = 'gold';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw active power-up indicators
    let indicatorX = 10;
    const indicatorY = 10;
    const indicatorSize = 30;
    
    if (activePowerups.jetpack && assets.images.jetpackIcon) {
        ctx.drawImage(assets.images.jetpackIcon, indicatorX, indicatorY, indicatorSize, indicatorSize);
        indicatorX += indicatorSize + 10;
    }
    
    if (activePowerups.magnet && assets.images.magnetIcon) {
        ctx.drawImage(assets.images.magnetIcon, indicatorX, indicatorY, indicatorSize, indicatorSize);
        indicatorX += indicatorSize + 10;
    }
    
    if (activePowerups.invisibility && assets.images.invisibilityIcon) {
        ctx.drawImage(assets.images.invisibilityIcon, indicatorX, indicatorY, indicatorSize, indicatorSize);
    }
    
    // Draw debug info if needed
    if (window.DEBUG_MODE) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(10, 50, 200, 100);
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        if (cat) {
            ctx.fillText(`Cat position: ${Math.floor(cat.x)}, ${Math.floor(cat.y)}`, 15, 65);
            ctx.fillText(`Velocity: ${cat.velocityY.toFixed(2)}`, 15, 80);
            ctx.fillText(`Jumping: ${cat.jumping}`, 15, 95);
        }
        
        ctx.fillText(`Game speed: ${gameSpeed.toFixed(2)}`, 15, 110);
        ctx.fillText(`Obstacles: ${obstacles.length}`, 15, 125);
        ctx.fillText(`Power-ups: ${powerups.length}`, 15, 140);
    }
    
    drawParticles();
}

// Reset the game
function resetGame() {
    console.log('Resetting game');
    
    // Hide game over screen, show game screen
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameScreen = document.getElementById('game-screen');
    
    if (gameOverScreen && gameScreen) {
        gameOverScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
    } else {
        console.error('Game over screen or game screen elements not found');
    }
    
    // Check if cat is initialized
    if (!cat) {
        console.error('Cat not initialized during reset');
        // Initialize cat as fallback
        cat = {
            x: 100,
            y: groundY - 60,
            width: 60,
            height: 60,
            velocityY: 0,
            jumping: false,
            image: assets.images.cat
        };
    } else {
        // Reset cat position
        cat.x = 100;
        cat.y = groundY - cat.height;
        cat.velocityY = 0;
        cat.jumping = false;
        cat.image = assets.images.cat;
    }
    
    // Reset game variables
    gameOver = false;
    score = 0;
    gameSpeed = GAME_SPEED_INITIAL;
    obstacleFrequency = OBSTACLE_FREQUENCY_INITIAL;
    obstacles = [];
    powerups = [];
    coins = [];
    lastObstacleTime = 0;
    lastPowerupTime = 0;
    
    // Reset active powerups
    activePowerups.jetpack = false;
    activePowerups.magnet = false;
    activePowerups.invisibility = false;
    
    // Clear any existing powerup timers
    clearTimeout(powerupTimers.jetpack);
    clearTimeout(powerupTimers.magnet);
    clearTimeout(powerupTimers.invisibility);
    
    // Play background music
    if (!muted && assets.sounds.backgroundMusic) {
        try {
            assets.sounds.backgroundMusic.currentTime = 0;
            const playPromise = assets.sounds.backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error('Error playing music:', e);
                });
            }
        } catch (e) {
            console.error('Error playing background music:', e);
        }
    }
    
    // Update score display
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = '0';
    }
}

// Main game loop
function gameLoop(timestamp) {
    try {
        // Draw even if game hasn't started
        draw();
        
        // Only update if game has started
        if (gameStarted) {
            update(timestamp);
        }
        
        requestAnimationFrame(gameLoop);
    } catch (e) {
        console.error('Error in game loop:', e);
        // Continue the loop even if there's an error
        requestAnimationFrame(gameLoop);
    }
}

// Enable debug mode with URL parameter
window.DEBUG_MODE = window.location.search.includes('debug=true');

// Add console logging for debugging
console.log('Game script loaded');

// --- IMPROVEMENTS: HIGH SCORE, PAUSE, SETTINGS, ACCESSIBILITY, SHARING, CODE COMMENTS ---

// High score: store in localStorage
function loadHighScore() {
    const saved = localStorage.getItem('sadCatRunnerHighScore');
    highScore = saved ? parseInt(saved, 10) : 0;
}
function saveHighScore() {
    localStorage.setItem('sadCatRunnerHighScore', highScore);
}

// Pause/Resume feature
window.sadCatPaused = false;
function togglePause() {
    window.sadCatPaused = !window.sadCatPaused;
    if (window.sadCatPaused) {
        if (assets.sounds.backgroundMusic) assets.sounds.backgroundMusic.pause();
    } else {
        if (!muted && assets.sounds.backgroundMusic && gameStarted && !gameOver) {
            assets.sounds.backgroundMusic.play();
        }
    }
}

// Colorblind mode toggle
let colorblindMode = false;
function toggleColorblind() {
    colorblindMode = !colorblindMode;
    document.body.classList.toggle('colorblind', colorblindMode);
}
document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyC') toggleColorblind();
});

// Accessibility: keyboard navigation for replay/share
window.addEventListener('DOMContentLoaded', function() {
    const restartBtn = document.getElementById('restart-button');
    const shareBtn = document.getElementById('share-button');
    if (restartBtn) restartBtn.tabIndex = 0;
    if (shareBtn) shareBtn.tabIndex = 0;
});

// Enhanced sharing: WhatsApp (share link)
window.addEventListener('DOMContentLoaded', function() {
    let waBtn = document.getElementById('share-whatsapp');
    if (!waBtn) {
        waBtn = document.createElement('div');
        waBtn.id = 'share-whatsapp';
        waBtn.className = 'share-option';
        waBtn.textContent = '🟢';
        document.querySelector('.share-options')?.appendChild(waBtn);
    }
    waBtn.onclick = function() {
        const url = encodeURIComponent(window.location.href);
        const msg = encodeURIComponent('Try to beat my score in Sad Cat Runner!');
        window.open(`https://wa.me/?text=${msg}%20${url}`,'_blank');
    };
});

// Show high score on start/game over screens
window.addEventListener('DOMContentLoaded', function() {
    const hsEls = document.querySelectorAll('.high-score');
    loadHighScore();
    hsEls.forEach(el => el.textContent = highScore);
});
