import { LevelManager } from './LevelManager.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
const levelManager = new LevelManager();
let currentLevelId = 1;

function preload() {
    // Placeholder textures generation...
    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0x3498db, 1);
    this.graphics.beginPath();
    this.graphics.arc(0, 0, 20, 0, Math.PI * 2);
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.generateTexture('fluffy', 40, 40);
    this.graphics.destroy();

    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0x95a5a6, 1);
    this.graphics.fillRect(0, 0, 40, 40);
    this.graphics.generateTexture('tile', 40, 40);
    this.graphics.destroy();

    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0xe74c3c, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(0, 40);
    this.graphics.lineTo(20, 0);
    this.graphics.lineTo(40, 40);
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.generateTexture('spike', 40, 40);
    this.graphics.destroy();

    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0xf1c40f, 1);
    this.graphics.beginPath();
    this.graphics.arc(20, 20, 10, 0, Math.PI * 2);
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.generateTexture('gem', 40, 40);
    this.graphics.destroy();
}

let player;
let platforms;
let spikes;
let gems;
let cursors;
let score = 0;
let scoreText;
let levelText;

function create() {
    const levelData = levelManager.getLevel(currentLevelId);

    this.cameras.main.setBackgroundColor('#1abc9c');
    this.cameras.main.setBounds(0, 0, levelData.length, 600);
    this.physics.world.setBounds(0, 0, levelData.length, 600);

    platforms = this.physics.add.staticGroup();
    spikes = this.physics.add.staticGroup();
    gems = this.physics.add.group();

    levelData.platforms.forEach(p => {
        let platform = platforms.create(p.x, p.y, 'tile');
        platform.setDisplaySize(p.width, 40);
        platform.refreshBody();
    });

    levelData.spikes.forEach(s => {
        spikes.create(s.x, s.y, 'spike');
    });

    levelData.gems.forEach(g => {
        gems.create(g.x, g.y, 'gem').setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    player = this.physics.add.sprite(100, 450, 'fluffy');
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(player, spikes, hitSpike, null, this);
    this.physics.add.overlap(player, gems, collectGem, null, this);

    this.cameras.main.startFollow(player);

    scoreText = this.add.text(16, 16, 'Score: ' + score, { fontSize: '32px', fill: '#fff' }).setScrollFactor(0);
    levelText = this.add.text(16, 56, 'Level: ' + currentLevelId, { fontSize: '24px', fill: '#fff' }).setScrollFactor(0);

    cursors = this.input.keyboard.createCursorKeys();
}

function hitSpike(player, spike) {
    this.physics.pause();
    player.setTint(0xff0000);
    this.time.delayedCall(1000, () => {
        this.scene.restart();
    });
}

function collectGem(player, gem) {
    gem.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);
}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-600);
    }
}
