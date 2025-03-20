class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 320;
        this.canvas.height = 480;
        
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
        
        // Bird and pipe properties
        this.bird = {
            x: 50,
            y: this.canvas.height / 3,
            width: 34,
            height: 24,
            velocity: 0,
            gravity: 0.8,
            jump: -9.5,
            rotation: 0,
            rotationSpeed: 0.08
        };
        
 
        this.pipes = [];
        this.pipeWidth = 52;
        this.initialPipeGap = 150;
        this.pipeGap = this.initialPipeGap;
        this.pipeSpacing = 250;
        this.initialPipeSpeed = 3;
        this.pipeSpeed = this.initialPipeSpeed;
        
        // Difficulty settings
        this.difficultyInterval = 15;
        this.speedIncrease = 0.2;
        this.gapDecrease = 10;
        this.maxDifficultyLevel = 5;
        
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
        // Update best score
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
        // Define minimum and maximum positions for the gap
        const minGapPosition = 120; // Minimum distance from top
        const maxGapPosition = this.canvas.height - this.pipeGap - 120; // Maximum distance from top, accounting for ground and minimum bottom space
        
        // Calculate gap position within the range
        const gapPosition = Math.random() * (maxGapPosition - minGapPosition) + minGapPosition;
        
        this.pipes.push({
            x: this.canvas.width,
            gapY: gapPosition,
            passed: false
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
            pipe.x -= this.pipeSpeed * 2;
            
            // Check collision
            if (this.checkCollision(pipe)) {
                this.gameOver = true;
                document.getElementById('finalScore').textContent = this.score;
                document.getElementById('bestScore').textContent = this.bestScore;
                document.getElementById('gameOverScreen').classList.remove('hidden');
            }
            
            // Check if pipe has passed
            if (!pipe.passed && pipe.x < this.bird.x) {
                pipe.passed = true;
                this.score++;
                
                // Increase difficulty based on score
                if (this.score <= 60) {
                    // Before 60 increase every 15 points
                    if (this.score % this.difficultyInterval === 0 && 
                        this.score / this.difficultyInterval <= this.maxDifficultyLevel) {
                        this.increaseDifficulty();
                    }
                } else {
                    // After score of 60, increase speed every 10 points
                    if (this.score % 10 === 0) {
                        this.pipeSpeed += this.speedIncrease;
                    }
                }
                
                if (this.score > this.bestScore) {
                    this.bestScore = this.score;
                    localStorage.setItem('bestScore', this.bestScore);
                }
            }
            
            // Remove off screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
        
        // Adds new pipes
        if (this.pipes.length === 0 || 
            this.pipes[this.pipes.length - 1].x < this.canvas.width - this.pipeSpacing) {
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
            this.ctx.scale(-1, -1); // Flip both horizontally and vertically
            // pipes body
            this.ctx.drawImage(
                this.images.pipe,
                0, 0, this.pipeWidth, 320, // Source rectangle for pipe body
                0, 0, this.pipeWidth, pipe.gapY // Destination rectangle
            );
            // pipes cap
            this.ctx.drawImage(
                this.images.pipe,
                0, 346, this.pipeWidth, 26, // Source rectangle for pipe cap
                0, pipe.gapY - 26, this.pipeWidth, 26 // Destination rectangle
            );
            this.ctx.restore();
            
            // Lower pipe
            // pipes body
            this.ctx.drawImage(
                this.images.pipe,
                0, 0, this.pipeWidth, 320, // Source rectangle for pipe body
                pipe.x, pipe.gapY + this.pipeGap, this.pipeWidth, this.canvas.height - (pipe.gapY + this.pipeGap) // Destination rectangle
            );
            // pipe cap drawing
            this.ctx.drawImage(
                this.images.pipe,
                0, 346, this.pipeWidth, 26, // Source rectangle for pipe cap (bottom cap)
                pipe.x, pipe.gapY + this.pipeGap, this.pipeWidth, 26 // Destination rectangle
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
        
        // Draw score
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
        
        // Only decrease gap size if score is less than or equal to 60
        if (this.score <= 60) {
            this.pipeGap = Math.max(90, this.pipeGap - this.gapDecrease);
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new FlappyBird();
}); 