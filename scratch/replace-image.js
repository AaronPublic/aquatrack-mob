const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Check if it imports Image from react-native
  const rnImportRegex = /import\s+({[^}]*})\s+from\s+['"]react-native['"]/g;
  let matches = [...content.matchAll(rnImportRegex)];
  
  let modified = false;

  for (const match of matches) {
    const importBlock = match[1];
    if (importBlock.includes('Image')) {
      // Remove Image from the block
      const newImportBlock = importBlock.replace(/\bImage\b\s*,?/, '').replace(/,\s*}/, ' }').replace(/{\s*,/, '{ ');
      content = content.replace(match[0], `import ${newImportBlock} from 'react-native';\nimport { Image } from 'expo-image';`);
      modified = true;
    }
  }

  if (modified) {
    // 2. Replace resizeMode with contentFit
    content = content.replace(/resizeMode=["']cover["']/g, 'contentFit="cover"');
    content = content.replace(/resizeMode=["']contain["']/g, 'contentFit="contain"');
    content = content.replace(/resizeMode=\{([^}]+)\}/g, 'contentFit={$1}');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, '../components'));
console.log('Done');
