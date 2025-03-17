import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        this.platforms = null;
        this.cursors = null;
        this.stars = null;
        this.score = 0;
        this.scoreText = null;
        this.backgroundStars = [];
        this.currentLevel = 1;
        this.levelText = null;
        this.worldHeight = 6000;
        this.debugText = null;
        this.canJump = false;
        this.levelHeight = 200;
        this.platformZone = 150;
        this.jumpHeight = 140;
    }

    preload() {
        this.load.image('sky', '/assets/images/sky.png');
        this.load.image('ground', '/assets/images/platform.png');
        this.load.image('star', '/assets/images/star.png');
        this.load.spritesheet('dude', '/assets/images/dude.png',
            { frameWidth: 32, frameHeight: 48 }
        );
    }

    createBackgroundStar(x, y) {
        const star = this.add.sprite(x, y, 'star').setScale(0.3);
        star.setAlpha(0.3);
        star.originalY = y;
        star.twinkleSpeed = Phaser.Math.FloatBetween(1, 2);
        star.setScrollFactor(0.1);
        return star;
    }

    createPlatformsForLevel(levelY) {
        const PLATFORM_WIDTH = 400; // Full platform width before scaling
        const MIN_GAP = 40; // Minimum gap in pixels
        const SCALE = 0.24; // Tripled from 0.08 to make platforms wider
        const EFFECTIVE_WIDTH = PLATFORM_WIDTH * SCALE; // ~96 pixels after scaling
        const PLATFORM_HEIGHT = 32; // Platform height

        // Special handling for first level
        if (levelY > this.worldHeight - this.levelHeight) {
            // First level - wider platforms with good spacing
            const firstLevelPlatforms = [
                { x: 150, y: this.worldHeight - 45 },    // Left side
                { x: 400, y: this.worldHeight - 95 },    // Center
                { x: 650, y: this.worldHeight - 145 }    // Right side
            ];

            firstLevelPlatforms.forEach(({ x, y }) => {
                const platform = this.platforms.create(x, y, 'ground');
                platform.setImmovable(true);
                platform.setScale(SCALE, 0.5); // Wider but same height
                platform.body.setSize(platform.width * SCALE, platform.height * 0.5);
                platform.refreshBody();
            });
            return;
        }

        // Special handling for second level - wider platforms
        if (levelY > this.worldHeight - (2 * this.levelHeight)) {
            const secondLevelPlatforms = [
                { x: 650, y: this.worldHeight - 200 },   // Right side
                { x: 400, y: this.worldHeight - 240 },   // Center
                { x: 150, y: this.worldHeight - 280 }    // Left side
            ];

            secondLevelPlatforms.forEach(({ x, y }) => {
                const platform = this.platforms.create(x, y, 'ground');
                platform.setImmovable(true);
                platform.setScale(SCALE, 0.5);
                platform.body.setSize(platform.width * SCALE, platform.height * 0.5);
                platform.refreshBody();
            });
            return;
        }

        // For higher levels, create wider platforms
        const baseY = levelY - 20;
        const platforms = [
            { x: 150, y: baseY + 120, scale: SCALE },   // Left side
            { x: 400, y: baseY + 80, scale: SCALE },    // Center
            { x: 650, y: baseY + 40, scale: SCALE }     // Right side
        ];

        // Create all platforms for this level
        platforms.forEach(({ x, y, scale }) => {
            const platform = this.platforms.create(x, y, 'ground');
            platform.setImmovable(true);
            platform.setScale(scale, 0.5);
            platform.body.setSize(platform.width * scale, platform.height * 0.5);
            platform.refreshBody();
        });
    }

    create() {
        // Configure physics
        this.physics.world.setBounds(0, 0, 800, this.worldHeight);
        this.physics.world.gravity.y = 600;

        // Create repeating background
        for (let y = 0; y < this.worldHeight; y += 600) {
            this.add.image(400, y, 'sky').setScrollFactor(0.1);
        }

        // Add background stars
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, this.worldHeight);
            this.backgroundStars.push(this.createBackgroundStar(x, y));
        }

        // Add platforms group
        this.platforms = this.physics.add.staticGroup();

        // Create ground
        const ground = this.platforms.create(400, this.worldHeight - 32, 'ground');
        ground.setScale(2).refreshBody();
        ground.setImmovable(true);

        // Create initial platforms for each level
        for (let level = 1; level <= 10; level++) {
            this.createPlatformsForLevel(this.worldHeight - (level * this.levelHeight));
        }

        // Add player with specific physics settings
        this.player = this.physics.add.sprite(100, this.worldHeight - 100, 'dude');
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(24, 48);
        this.player.body.setOffset(4, 0);

        // Add stars
        this.stars = this.physics.add.group({
            bounceY: 0.1
        });
        this.addStarsForLevel(this.worldHeight - this.levelHeight);

        // Player animations
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        // Add collisions with specific callback
        this.physics.add.collider(this.player, this.platforms, this.handlePlatformCollision, null, this);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();

        // Setup camera
        this.cameras.main.setBounds(0, 0, 800, this.worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        // Add score text (fixed to camera)
        this.scoreText = this.add.text(16, 16, 'Score: 0', { 
            fontSize: '32px', 
            fill: '#fff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);

        // Add level text
        this.levelText = this.add.text(16, 56, 'Level: 1', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);

        // Add debug text
        this.debugText = this.add.text(16, 96, '', {
            fontSize: '16px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);
    }

    handlePlatformCollision(player, platform) {
        if (player.body.touching.down && platform.body.touching.up) {
            this.canJump = true;
        }
    }

    addStarsForLevel(levelY) {
        for (let i = 0; i < 3; i++) {  // Reduced from 5 to 3 stars
            const x = Phaser.Math.Between(0, 800);
            const y = levelY - Phaser.Math.Between(0, this.platformZone);
            const star = this.stars.create(x, y, 'star');
            star.setBounceY(0.2);
        }
    }

    checkLevel() {
        const newLevel = Math.ceil((this.worldHeight - this.player.y) / this.levelHeight);
        if (newLevel > this.currentLevel) {
            this.currentLevel = newLevel;
            this.levelText.setText('Level: ' + this.currentLevel);
            this.addStarsForLevel(this.player.y);
        }
    }

    collectStar(player, star) {
        star.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }

    update(time) {
        // Animate background stars (twinkling effect)
        this.backgroundStars.forEach(star => {
            star.alpha = 0.3 + Math.sin(time * 0.001 * star.twinkleSpeed) * 0.2;
            star.y = star.originalY + Math.sin(time * 0.001) * 2;
        });

        const onGround = this.player.body.blocked.down || this.player.body.touching.down;

        // Handle player movement with better acceleration
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        // Handle jumping
        if (onGround) {
            if (this.cursors.up.isDown || this.cursors.space.isDown) {
                this.player.setVelocityY(-450);
            }
        }

        // Update debug text with more useful information
        this.debugText.setText(
            `On Ground: ${onGround}\n` +
            `Player Y: ${Math.round(this.player.y)}\n` +
            `Level: ${this.currentLevel}\n` +
            `Velocity Y: ${Math.round(this.player.body.velocity.y)}`
        );

        // Check level progress
        this.checkLevel();
    }
}

export default MainScene; 