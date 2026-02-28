import fs from 'fs';

try {
    fs.copyFileSync(
        'C:/Users/karth/.gemini/antigravity/brain/a9dfcba1-ca94-4224-b328-7ba323f469a9/hero_academic_v2_1772278721166.png',
        'C:/Users/karth/Downloads/Smart-Report/frontend/src/assets/hero_academic_v2.png'
    );
    console.log("Successfully copied the image!");
} catch (error) {
    console.error(error);
}
