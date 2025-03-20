const https = require('https');
const fs = require('fs');
const path = require('path');

const assets = {
    'bird.png': 'https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/sprites/yellowbird-midflap.png',
    'background.png': 'https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/sprites/background-day.png',
    'pipe.png': 'https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/sprites/pipe-green.png',
    'ground.png': 'https://raw.githubusercontent.com/sourabhv/FlapPyBird/master/assets/sprites/base.png'
};

const assetsDir = path.join(__dirname, 'assets');

if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
}

Object.entries(assets).forEach(([filename, url]) => {
    const filepath = path.join(assetsDir, filename);
    const file = fs.createWriteStream(filepath);
    
    https.get(url, response => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${filename}`);
        });
    }).on('error', err => {
        fs.unlink(filepath);
        console.error(`Error downloading ${filename}:`, err.message);
    });
}); 