const fs = require('fs');
const { execSync } = require('child_process');

const currPath = 'c:\\Users\\sk-y\\Code\\forge-simulator\\apps\\web\\app\\forge\\page.tsx';

const origContent = execSync('git show HEAD:apps/web/app/forge/page.tsx', { encoding: 'utf8' });
const currContent = fs.readFileSync(currPath, 'utf8');

const keyword = '  return (';
const returnIndex = origContent.lastIndexOf(keyword);
if (returnIndex === -1) {
  console.log("Could not find return block");
  process.exit(1);
}

let uiBlock = origContent.substring(returnIndex);
uiBlock = uiBlock.substring(0, uiBlock.lastIndexOf('}'));

uiBlock = uiBlock.replace('return (', 'return (\n    <LazyMotion features={domAnimation}>');
uiBlock = uiBlock.substring(0, uiBlock.lastIndexOf(');')) + '    </LazyMotion>\n  );';

const currReturnIndex = currContent.indexOf('  return (');
const newContent = currContent.substring(0, currReturnIndex) + uiBlock + '\n}\n';

fs.writeFileSync(currPath, newContent, 'utf8');
console.log("page.tsx fixed successfully!");
