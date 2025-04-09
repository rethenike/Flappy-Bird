class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Check if device is touch-enabled
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        // Adjust canvas size for mobile
        if (this.isTouchDevice) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            this.canvas.width = 320;    
            this.canvas.height = 480;   
        }
        
        this.images = {
            bird: new Image(),
            background: new Image(),
            pipe: new Image(),
            ground: new Image()
        };
        
        this.images.bird.src = 'assets/bird.png';
        this.images.background.src = 'assets/background.png';
        this.images.pipe.src = 'assets/pipe.png';
        this.images.ground.src = 'assets/ground.png';
        
        // Game state
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        
        // Bird properties
        this.bird = {
            x: this.isTouchDevice ? this.canvas.width * 0.2 : 50,
            y: this.canvas.height / 3,
            width: 34,
            height: 24,
            velocity: 0,
            gravity: this.isTouchDevice ? 0.1 : 0.08,    
            jump: this.isTouchDevice ? -3 : -2.5,     
            rotation: 0,
            rotationSpeed: 0.08
        };
        
        // Pipe properties
        this.pipes = [];
        this.pipeWidth = 42;    
        this.initialPipeGap = 150;
        this.pipeGap = this.initialPipeGap;
        this.minPipeSpacing = 120;  
        this.maxPipeSpacing = 180;  
        this.initialPipeSpeed = this.isTouchDevice ? 0.4 : 0.25;
        this.pipeSpeed = this.initialPipeSpeed;
        
        // Difficulty settings
        this.difficultyInterval = 15;
        this.speedIncrease = this.isTouchDevice ? 0.03 : 0.02;     
        this.gapDecrease = 10;
        this.maxDifficultyLevel = 5;
        
        // Calculate speed multiplier based on screen size
        this.speedMultiplier = Math.min(this.canvas.width / 320, this.isTouchDevice ? 0.6 : 0.4); 
        
        // Ground properties
        this.ground = {
            y: this.canvas.height - 112,
            height: 112   
        };
        
        this.setupEventListeners();
        
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
        
        // Update best score display on start screen
        document.getElementById('startBestScore').textContent = this.bestScore;
    }
    
    setupEventListeners() {
        // Mouse click
        this.canvas.addEventListener('click', () => this.handleInput());
        
        // Touchscreen
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        
        // spacebar
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.handleInput();
            }
        });
        
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            document.getElementById('startScreen').classList.add('hidden');
            this.startGame();
        });
        
        // play again button
        document.getElementById('restartButton').addEventListener('click', () => {
            document.getElementById('gameOverScreen').classList.add('hidden');
            this.resetGame();
            this.startGame();
        });
    }
    
    handleInput() {
        if (!this.gameStarted) {
            document.getElementById('startScreen').classList.add('hidden');
            this.startGame();
        } else if (!this.gameOver) {
            this.bird.velocity = this.bird.jump;
        }
    }
    
    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.score = 0;
        this.pipes = [];
        this.bird.y = this.canvas.height / 3;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipeGap = this.initialPipeGap;
        this.pipeSpeed = this.initialPipeSpeed;
        // best score
        document.getElementById('startBestScore').textContent = this.bestScore;
        this.addPipe();
    }
    
    resetGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.pipes = [];
        this.bird.y = this.canvas.height / 3;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
    }
    
    addPipe() {
        //  minimum and maximum positions for the gap
        const minGapPosition = 120; 
        const maxGapPosition = this.canvas.height - this.pipeGap - 120;  
        
        // Calculate gap position 
        const gapPosition = Math.random() * (maxGapPosition - minGapPosition) + minGapPosition;
        
        // Calculate spacing between pipes
        const randomSpacing = Math.random() * (this.maxPipeSpacing - this.minPipeSpacing) + this.minPipeSpacing;
        
        this.pipes.push({
            x: this.canvas.width,
            gapY: gapPosition,    // store random spacing for pipes
            passed: false,
            spacing: randomSpacing  
        });
    }
    
    update() {
        if (!this.gameStarted || this.gameOver) return;
        
        // Update bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        this.bird.rotation = Math.min(Math.PI / 2, Math.max(-Math.PI / 2, this.bird.velocity * this.bird.rotationSpeed));
        
        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= (this.pipeSpeed * 2) / this.speedMultiplier;
            
            // Check collision
            if (this.checkCollision(pipe)) {
                this.gameOver = true;
                document.getElementById('finalScore').textContent = this.score;
                document.getElementById('bestScore').textContent = this.bestScore;
                document.getElementById('gameOverScreen').classList.remove('hidden');
            }
            
            // check if pipe has passed
            if (!pipe.passed && pipe.x < this.bird.x) {
                pipe.passed = true;
                this.score++;
                
                // Increase Difficulty based on score
                if (this.score <= 60) {
                    if (this.score % this.difficultyInterval === 0 && 
                        this.score / this.difficultyInterval <= this.maxDifficultyLevel) {
                        this.increaseDifficulty();
                    }
                } else {
                    if (this.score % 10 === 0) {
                        this.pipeSpeed += this.speedIncrease;
                    }
                }
                
                if (this.score > this.bestScore) {
                    this.bestScore = this.score;
                    localStorage.setItem('bestScore', this.bestScore);
                }
            }
            
            // Rremove off screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
        
        // Add new pipes with random spacing
        if (this.pipes.length === 0 || 
            this.pipes[this.pipes.length - 1].x < this.canvas.width - this.pipes[this.pipes.length - 1].spacing) {
            this.addPipe();
        }
        
        // Checks if bird hits any objects
        if (this.bird.y + this.bird.height > this.ground.y || this.bird.y < 0) {
            this.gameOver = true;
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('bestScore').textContent = this.bestScore;
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }
    }
    
    checkCollision(pipe) {
        return (
            this.bird.x + this.bird.width > pipe.x &&
            this.bird.x < pipe.x + this.pipeWidth &&
            (this.bird.y < pipe.gapY || this.bird.y + this.bird.height > pipe.gapY + this.pipeGap)
        );
    }
    
    draw() {
        // Dbackground
        this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        
        // pipes
        for (const pipe of this.pipes) {
            // Upper pipe (flipped)
            this.ctx.save();
            this.ctx.translate(pipe.x + this.pipeWidth, pipe.gapY);
            this.ctx.scale(-1, -1); 

            // pipes body
            this.ctx.drawImage(
                this.images.pipe,
                0, 0, this.pipeWidth, 320, 
                0, 0, this.pipeWidth, pipe.gapY 
            );
            // pipes cap
            this.ctx.drawImage(
                this.images.pipe,
                0, 346, this.pipeWidth, 26, 
                0, pipe.gapY - 26, this.pipeWidth, 26 
            );
            this.ctx.restore();
            
            
            // pipes body
            this.ctx.drawImage(
                this.images.pipe,
                0, 0, this.pipeWidth, 320, 
                pipe.x, pipe.gapY + this.pipeGap, this.pipeWidth, this.canvas.height - (pipe.gapY + this.pipeGap) 
            );
            // pipe cap drawing
            this.ctx.drawImage(
                this.images.pipe,
                0, 346, this.pipeWidth, 26, 
                pipe.x, pipe.gapY + this.pipeGap, this.pipeWidth, 26 
            );
        }
        
        // ground image
        this.ctx.drawImage(this.images.ground, 0, this.ground.y, this.canvas.width, this.ground.height);
        
        // bird
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(this.bird.rotation);
        this.ctx.drawImage(
            this.images.bird,
            -this.bird.width / 2,
            -this.bird.height / 2,
            this.bird.width,
            this.bird.height
        );
        this.ctx.restore();
        
        // draw score
        if (this.gameStarted && !this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.score.toString(), this.canvas.width / 2, 40);
        }
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(this.animate);
    }
    
    increaseDifficulty() {
        // Always increase speed
        this.pipeSpeed += this.speedIncrease;
        
        // decrease gap size if score is less than or equal to 60
        if (this.score <= 60) {
            this.pipeGap = Math.max(90, this.pipeGap - this.gapDecrease);
        }
    }
}

// start the game when the page loads
window.addEventListener('load', () => {
    new FlappyBird();
}); 