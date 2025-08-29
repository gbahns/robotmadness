import fs from 'fs';
import path from 'path';

/**
 * Convert board definition files from rotate to entries format
 */

function convertRotateToEntries(content: string): string {
  const lines = content.split('\n');
  const newLines: string[] = [];
  
  for (const line of lines) {
    let newLine = line;
    
    // Check if this line has a conveyor with rotate
    if (line.includes('rotate:') && (line.includes('CONVEYOR') || line.includes('EXPRESS_CONVEYOR'))) {
      // Extract direction and rotate values
      const directionMatch = line.match(/direction:\s*Direction\.(\w+)/);
      const rotateMatch = line.match(/rotate:\s*'(clockwise|counterclockwise)'/);
      
      if (directionMatch && rotateMatch) {
        const exitDir = directionMatch[1];
        const rotateDir = rotateMatch[1];
        let entryDir: string;
        
        if (rotateDir === 'clockwise') {
          // For clockwise, entry is 90° counter-clockwise from exit
          switch (exitDir) {
            case 'UP':
              entryDir = 'RIGHT';
              break;
            case 'RIGHT':
              entryDir = 'DOWN';
              break;
            case 'DOWN':
              entryDir = 'LEFT';
              break;
            case 'LEFT':
              entryDir = 'UP';
              break;
            default:
              entryDir = 'UP'; // fallback
          }
        } else {
          // For counter-clockwise, entry is 90° clockwise from exit
          switch (exitDir) {
            case 'UP':
              entryDir = 'LEFT';
              break;
            case 'RIGHT':
              entryDir = 'UP';
              break;
            case 'DOWN':
              entryDir = 'RIGHT';
              break;
            case 'LEFT':
              entryDir = 'DOWN';
              break;
            default:
              entryDir = 'UP'; // fallback
          }
        }
        
        // Replace rotate with entries
        newLine = newLine.replace(/,?\s*rotate:\s*'(clockwise|counterclockwise)'/, '');
        // Add entries before the closing brace
        newLine = newLine.replace(/\s*\}/, `, entries: [Direction.${entryDir}] }`);
      }
    }
    
    newLines.push(newLine);
  }
  
  return newLines.join('\n');
}

// Process all board files
const boardsDir = path.join(__dirname, '../lib/game/boards');

function processFile(filePath: string) {
  if (!filePath.endsWith('.ts')) return;
  
  console.log(`Processing ${path.basename(filePath)}...`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has any rotate properties
  if (!content.includes('rotate:')) {
    console.log(`  No rotate properties found, skipping.`);
    return;
  }
  
  const newContent = convertRotateToEntries(content);
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`  ✓ Converted rotate to entries`);
    
    // Count conversions
    const rotateCount = (content.match(/rotate:/g) || []).length;
    const entriesCount = (newContent.match(/entries:/g) || []).length - (content.match(/entries:/g) || []).length;
    console.log(`    Converted ${entriesCount} tiles`);
  } else {
    console.log(`  No changes made`);
  }
}

// Process main board files
const boardFiles = fs.readdirSync(boardsDir);
boardFiles.forEach(file => {
  const filePath = path.join(boardsDir, file);
  const stat = fs.statSync(filePath);
  
  if (stat.isFile()) {
    processFile(filePath);
  } else if (stat.isDirectory()) {
    // Process files in subdirectories (like docking-bay)
    const subFiles = fs.readdirSync(filePath);
    subFiles.forEach(subFile => {
      const subFilePath = path.join(filePath, subFile);
      if (fs.statSync(subFilePath).isFile()) {
        processFile(subFilePath);
      }
    });
  }
});

console.log('\nConversion complete!');