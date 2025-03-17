import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const assets = {
    images: {
        'sky.png': 'https://labs.phaser.io/assets/skies/space3.png',
        'platform.png': 'https://labs.phaser.io/assets/sprites/platform.png',
        'star.png': 'https://labs.phaser.io/assets/sprites/star.png',
        'dude.png': 'https://labs.phaser.io/assets/sprites/dude.png'
    },
    audio: {
        'jump.wav': 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/jump.wav',
        'collect.wav': 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/coin.wav',
        'background.wav': 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/Looping_Background/happy.wav'
    }
};

function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, response => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, redirectedResponse => {
                    redirectedResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`Downloaded: ${destination}`);
                        resolve();
                    });
                }).on('error', err => {
                    fs.unlink(destination, () => {});
                    reject(err);
                });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded: ${destination}`);
                    resolve();
                });
            }
        }).on('error', err => {
            fs.unlink(destination, () => {});
            reject(err);
        });
    });
}

async function downloadAssets() {
    // Create directories if they don't exist
    const dirs = [
        'public/assets/images',
        'public/assets/audio'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    // Download images
    for (const [filename, url] of Object.entries(assets.images)) {
        await downloadFile(url, path.join('public/assets/images', filename));
    }

    // Download audio
    for (const [filename, url] of Object.entries(assets.audio)) {
        await downloadFile(url, path.join('public/assets/audio', filename));
    }
}

downloadAssets().catch(console.error); 