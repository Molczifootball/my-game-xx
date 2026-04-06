const sharp = require('sharp');

async function main() {
  const files = ['outpost.png', 'settlement.png', 'stronghold.png', 'citadel.png', 'forest.png'];
  
  for (const file of files) {
    const path = 'public/images/map/' + file;
    try {
      const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
      // Sample corner pixels
      const corners = [[0,0], [info.width-1, 0], [0, info.height-1], [info.width-1, info.height-1]];
      console.log('\n--- ' + file + ' (' + info.width + 'x' + info.height + ') ---');
      for (const [x,y] of corners) {
        const idx = (y * info.width + x) * info.channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const hex = '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
        console.log('  Corner(' + x + ',' + y + '): ' + hex + '  rgb(' + r + ',' + g + ',' + b + ')');
      }
    } catch(e) {
      console.log(file + ': ' + e.message);
    }
  }
}

main();
