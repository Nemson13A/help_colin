document.addEventListener('DOMContentLoaded', () => {
    const emojiLayer = document.getElementById('emoji-layer');
    const startBtn = document.getElementById('start-btn');
    const homeScreen = document.getElementById('home-screen');
    const playScreen = document.getElementById('play-screen');

    const schoolEmojis = ['🎒', '📚', '✏️', '📐', '🍎', '🚌', '📏', '🎨', '⏰', '⚽', '🥛', '🥪', '🏫', '👟', '🥎', '🍩'];

    // 给标题字母设置动画延迟
    const letters = document.querySelectorAll('.letter');
    letters.forEach((letter, index) => {
        letter.style.setProperty('--i', index);
    });

    // 创建漂浮的学校表情符号
    function createEmoji() {
        const emoji = document.createElement('div');
        emoji.classList.add('floating-emoji');
        emoji.textContent = schoolEmojis[Math.floor(Math.random() * schoolEmojis.length)];
        
        // 随机位置和大小
        const startX = Math.random() * 100;
        const size = 0.8 + Math.random() * 1.0; // 图标尺寸变小
        const duration = 8 + Math.random() * 12; // 8s 到 20s
        const delay = Math.random() * 5;
        const rotation = Math.random() * 360;

        emoji.style.left = `${startX}vw`;
        emoji.style.fontSize = `${size}rem`;
        emoji.style.animationDuration = `${duration}s`;
        emoji.style.animationDelay = `-${delay}s`;
        emoji.style.transform = `rotate(${rotation}deg)`;

        emojiLayer.appendChild(emoji);

        // 动画结束后移除元素
        setTimeout(() => {
            emoji.remove();
        }, duration * 1000);
    }

    // 每隔一段时间生成一个表情符号
    setInterval(createEmoji, 2000); // 降低生成频率至 2000ms

    // 初始化一些表情符号
    for (let i = 0; i < 10; i++) {
        createEmoji();
    }

    // 游戏变量
    let score = 0;
    let lives = 3;
    let timer = 30;
    let gameActive = false;
    let timerInterval = null;
    let backpackPos = 50; // 百分比
    let backpackVelocity = 0; // 速度
    const FRICTION = 0.85; // 摩擦力
    const ACCELERATION = 0.15; // 加速度
    const MAX_SPEED = 2.0; // 最大速度
    
    const backpack = document.getElementById('backpack');
    const scoreVal = document.getElementById('score-val');
    const timerVal = document.getElementById('timer-val');
    const livesVal = document.getElementById('lives-val');
    const gameWorld = document.getElementById('game-world');
    const gameOverModal = document.getElementById('game-over-modal');
    const finalScoreVal = document.getElementById('final-score-val');
    const restartBtn = document.getElementById('restart-btn');
    const backHomeBtn = document.getElementById('back-home-btn');
    const fallingItems = [];

    // 按钮点击事件
    startBtn.addEventListener('click', () => {
        homeScreen.classList.remove('active');
        playScreen.classList.add('active');
        startGame();
    });

    restartBtn.addEventListener('click', () => {
        gameOverModal.classList.remove('active');
        startGame();
    });

    backHomeBtn.addEventListener('click', () => {
        gameOverModal.classList.remove('active');
        playScreen.classList.remove('active');
        homeScreen.classList.add('active');
        document.body.classList.remove('game-playing');
    });

    function startGame() {
        document.body.classList.add('game-playing');
        score = 0;
        lives = 3;
        timer = 30;
        scoreVal.textContent = score;
        timerVal.textContent = timer;
        updateLivesUI();
        
        gameActive = true;
        backpackPos = 50;
        backpackVelocity = 0;
        updateBackpackPosition();
        
        // 清理旧物品
        const oldItems = document.querySelectorAll('.falling-item');
        oldItems.forEach(item => item.remove());
        fallingItems.length = 0;

        // 启动计时器
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!gameActive) return;
            timer--;
            timerVal.textContent = timer;
            if (timer <= 0) {
                endGame("时间到！⏰", "科林成功带上了文具，向校车飞奔而去！🚌");
            }
        }, 1000);

        // 开始生成物品和游戏循环
        spawnItem();
        requestAnimationFrame(gameLoop);
    }

    function updateLivesUI() {
        livesVal.textContent = "❤️".repeat(lives);
    }

    function endGame(title, message) {
        gameActive = false;
        clearInterval(timerInterval);
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        finalScoreVal.textContent = score;
        gameOverModal.classList.add('active');
    }

    function updateBackpackPosition() {
        backpack.style.left = `${backpackPos}%`;
    }

    // 处理键盘输入
    const keys = {
        ArrowLeft: false,
        ArrowRight: false
    };

    window.addEventListener('keydown', (e) => {
        if (e.key in keys) keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
        if (e.key in keys) keys[e.key] = false;
    });

    // 处理手机端触控
    let touchStartX = 0;
    gameWorld.addEventListener('touchstart', (e) => {
        if (!gameActive) return;
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    gameWorld.addEventListener('touchmove', (e) => {
        if (!gameActive) return;
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - touchStartX;
        
        // 更新方向类
        if (deltaX < 0) {
            backpack.classList.remove('facing-right');
            backpack.classList.add('facing-left');
        } else if (deltaX > 0) {
            backpack.classList.remove('facing-left');
            backpack.classList.add('facing-right');
        }

        // 直接设置位置或根据偏移移动
        backpackPos += (deltaX / window.innerWidth) * 100;
        backpackPos = Math.max(5, Math.min(95, backpackPos));
        
        touchStartX = touchX;
        updateBackpackPosition();
    }, { passive: true });

    function updatePlayer() {
        if (keys.ArrowLeft) {
            backpackVelocity -= ACCELERATION;
            backpack.classList.remove('facing-right');
            backpack.classList.add('facing-left');
        } else if (keys.ArrowRight) {
            backpackVelocity += ACCELERATION;
            backpack.classList.remove('facing-left');
            backpack.classList.add('facing-right');
        } else {
            backpackVelocity *= FRICTION; // 惯性滑动
        }

        // 限制最大速度
        if (backpackVelocity > MAX_SPEED) backpackVelocity = MAX_SPEED;
        if (backpackVelocity < -MAX_SPEED) backpackVelocity = -MAX_SPEED;

        // 停止微小抖动
        if (Math.abs(backpackVelocity) < 0.01) backpackVelocity = 0;

        backpackPos += backpackVelocity;

        // 边缘检测与反弹/停止
        if (backpackPos <= 5) {
            backpackPos = 5;
            backpackVelocity = 0;
        } else if (backpackPos >= 95) {
            backpackPos = 95;
            backpackVelocity = 0;
        }

        updateBackpackPosition();
    }

    function spawnItem() {
        if (!gameActive) return;

        const item = document.createElement('div');
        item.classList.add('falling-item');
        
        // 定义物品类型及其属性
        const itemTypes = [
            { emoji: '📚', type: 'normal', score: 1 },
            { emoji: '✏️', type: 'normal', score: 1 },
            { emoji: '🍎', type: 'normal', score: 1 },
            { emoji: '📏', type: 'normal', score: 1 },
            { emoji: '🥪', type: 'rare', score: 5 },
            { emoji: '🧦', type: 'negative', score: 0 }
        ];

        // 随机选择，但控制概率
        let rand = Math.random();
        let selectedType;
        if (rand < 0.1) {
            selectedType = itemTypes[4]; // 稀有: 10%
        } else if (rand < 0.2) {
            selectedType = itemTypes[5]; // 负面: 10%
        } else {
            selectedType = itemTypes[Math.floor(Math.random() * 4)]; // 普通: 80%
        }

        item.textContent = selectedType.emoji;
        if (selectedType.type !== 'normal') {
            item.classList.add(selectedType.type);
        }

        // 随机水平位置
        const xPos = 5 + Math.random() * 90;
        item.style.left = `${xPos}%`;
        item.style.top = `-100px`;

        gameWorld.appendChild(item);
        
        fallingItems.push({
            element: item,
            y: -100,
            x: xPos,
            speed: 3 + Math.random() * 4,
            isRemoving: false,
            scoreValue: selectedType.score,
            isNegative: selectedType.type === 'negative'
        });

        // 随着时间推移，生成速度略微加快
        let spawnRate = Math.max(400, 1000 - (30 - timer) * 20);
        setTimeout(spawnItem, spawnRate + Math.random() * 500);
    }

    function gameLoop() {
        if (!gameActive) return;

        updatePlayer();

        for (let i = fallingItems.length - 1; i >= 0; i--) {
            const item = fallingItems[i];
            
            if (item.isRemoving) continue;

            item.y += item.speed;
            item.element.style.top = `${item.y}px`;

            const backpackRect = backpack.getBoundingClientRect();
            const itemRect = item.element.getBoundingClientRect();

            const hitBuffer = 15;
            if (
                itemRect.bottom >= backpackRect.top + hitBuffer &&
                itemRect.top <= backpackRect.bottom &&
                itemRect.right >= backpackRect.left + hitBuffer &&
                itemRect.left <= backpackRect.right - hitBuffer
            ) {
                item.isRemoving = true;
                
                if (item.isNegative) {
                    lives--;
                    updateLivesUI();
                    // 闪烁特效
                    backpack.style.opacity = "0.5";
                    setTimeout(() => backpack.style.opacity = "1", 200);
                    
                    if (lives <= 0) {
                        endGame("哎呀！😖", "科林被臭袜子熏晕了，没能赶上校车！");
                    }
                } else {
                    score += item.scoreValue;
                    scoreVal.textContent = score;
                }
                
                item.element.classList.add('item-collected');
                
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(item.isNegative ? [50, 50, 50] : 20);
                }
                
                setTimeout(() => {
                    item.element.remove();
                    const idx = fallingItems.indexOf(item);
                    if (idx > -1) fallingItems.splice(idx, 1);
                }, 200);

                continue;
            }

            if (item.y > window.innerHeight - 80) {
                item.isRemoving = true;
                item.element.classList.add('item-fade-out');
                
                setTimeout(() => {
                    item.element.remove();
                    const idx = fallingItems.indexOf(item);
                    if (idx > -1) fallingItems.splice(idx, 1);
                }, 500);
            }
        }

        requestAnimationFrame(gameLoop);
    }
});
