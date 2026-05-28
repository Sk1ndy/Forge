const fs = require('fs');
const { execSync } = require('child_process');

const currPath = 'c:\\Users\\sk-y\\Code\\forge-simulator\\apps\\web\\app\\forge\\page.tsx';
const currContent = fs.readFileSync(currPath, 'utf8');

// The original file is from HEAD
const origContent = execSync('git show HEAD:apps/web/app/forge/page.tsx', { encoding: 'utf8' });

// In the original file, find the main return block
const marker = "  const getSncColorClass = (percentage: number) => {";
const markerIndex = origContent.indexOf(marker);

// The actual return ( is shortly after this marker
const returnIndex = origContent.indexOf('  return (', markerIndex);

if (returnIndex === -1) {
  console.log("Could not find main return block in orig");
  process.exit(1);
}

// Extract from returnIndex to the end of the file, except the last '}'
let uiBlock = origContent.substring(returnIndex);
uiBlock = uiBlock.substring(0, uiBlock.lastIndexOf('}'));

// Wrap in LazyMotion
uiBlock = uiBlock.replace('  return (\n    <main', '  return (\n    <LazyMotion features={domAnimation}>\n    <main');
uiBlock = uiBlock.substring(0, uiBlock.lastIndexOf(');')) + '    </LazyMotion>\n  );';

// Inject it into currContent.
// currContent currently has a broken return block that starts at the first `  return (` after getSncColorClass
const currMarkerIndex = currContent.indexOf(marker);
const currReturnIndex = currContent.indexOf('  return (', currMarkerIndex);
const newContent = currContent.substring(0, currReturnIndex) + uiBlock + '\n}\n';

fs.writeFileSync(currPath, newContent, 'utf8');
console.log("page.tsx fixed successfully!");
