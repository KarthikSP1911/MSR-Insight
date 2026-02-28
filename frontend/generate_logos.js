const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generate() {
    const publicDir = path.join(__dirname, 'public');

    // Copy logo-icon.svg to favicon.svg
    fs.copyFileSync(
        path.join(publicDir, 'logo-icon.svg'),
        path.join(publicDir, 'favicon.svg')
    );

    // Generate transparent PNGs for icon
    await sharp(path.join(publicDir, 'logo-icon.svg'))
        .resize(512, 512)
        .png()
        .toFile(path.join(publicDir, 'logo-icon.png'));

    // Generate 32x32 favicon
    await sharp(path.join(publicDir, 'logo-icon.svg'))
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon-32x32.png'));

    // Generate 64x64 favicon
    await sharp(path.join(publicDir, 'logo-icon.svg'))
        .resize(64, 64)
        .png()
        .toFile(path.join(publicDir, 'favicon-64x64.png'));

    // Generate full logo transparent PNG
    await sharp(path.join(publicDir, 'logo-full.svg'))
        .resize(1600, 400)
        .png()
        .toFile(path.join(publicDir, 'logo-full.png'));

    console.log("All logos generated successfully!");
}

generate().catch(console.error);
