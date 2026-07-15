import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') && fs.readFileSync(file, 'utf8').includes('logger.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Replace any backslashes in the import path
    content = content.replace(/import logger from '([^']*)';/g, (match, p1) => {
        return `import logger from '${p1.replace(/\\/g, '/')}';`;
    });
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
});
