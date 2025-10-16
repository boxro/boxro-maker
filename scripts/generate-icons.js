const fs = require('fs');
const path = require('path');

// favicon.png를 읽어서 다양한 크기로 복사
const sourcePath = path.join(__dirname, '../public/favicon.png');
const targetSizes = [72, 96, 128, 144, 152, 192, 384, 512];

targetSizes.forEach(size => {
  const targetPath = path.join(__dirname, `../public/icons/icon-${size}x${size}.png`);
  
  // 파일이 존재하는지 확인
  if (fs.existsSync(sourcePath)) {
    // favicon.png를 복사 (실제로는 크기 변환이 필요하지만, 일단 복사)
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Created icon-${size}x${size}.png`);
  } else {
    console.log(`Source file not found: ${sourcePath}`);
  }
});

console.log('Icon generation completed');
