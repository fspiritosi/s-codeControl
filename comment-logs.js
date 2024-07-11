const fs = require('fs');
const path = require('path');
const glob = require('glob');

const commentLogs = (filePath) => {
  const data = fs.readFileSync(filePath, 'utf8');
  const result = data.replace(/console\.log\(/g, '// // // // console.log(');
  fs.writeFileSync(filePath, result, 'utf8');
};

const files = glob.sync('**/*.{js,ts,tsx}', { ignore: 'node_modules/**' });

files.forEach(commentLogs);

