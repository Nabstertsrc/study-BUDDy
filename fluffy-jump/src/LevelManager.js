export class LevelManager {
    constructor() {
        this.levels = this.generateLevels(100);
    }

    generateLevels(count) {
        const levels = [];
        for (let i = 1; i <= count; i++) {
            levels.push(this.createLevelData(i));
        }
        return levels;
    }

    createLevelData(levelNumber) {
        // Base seed for generation based on level number
        const length = 2000 + (levelNumber * 200);
        const platforms = [];
        const spikes = [];
        const gems = [];
        const checkpointX = length / 2;

        // Guaranteed starting platform
        platforms.push({ x: 400, y: 580, width: 800 });

        // Procedural generation
        let currentX = 600;
        while (currentX < length - 400) {
            const width = Phaser.Math.Between(100, 300);
            const height = Phaser.Math.Between(300, 500);
            const gap = Phaser.Math.Between(100, 200);

            platforms.push({ x: currentX + width / 2, y: height, width: width });

            // Random spikes on long platforms
            if (width > 200 && Phaser.Math.Between(0, 10) > 6) {
                spikes.push({ x: currentX + width / 2, y: height - 40 });
            }

            // Gems in the air
            gems.push({ x: currentX + width / 2, y: height - 100 });

            currentX += width + gap;
        }

        // End goal / Checkpoint
        platforms.push({ x: length - 200, y: 500, width: 400 });

        return {
            id: levelNumber,
            length: length,
            platforms: platforms,
            spikes: spikes,
            gems: gems,
            checkpointX: checkpointX
        };
    }

    getLevel(id) {
        return this.levels[id - 1];
    }
}
