// Builds index.html from the files in src/. Run: node build.js
const fs = require('fs');
const path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');

const body = src('template.html')
  .replace('/*SEED*/', () => src('seed.js'))
  .replace('/*HALL*/', () => src('hall.js'))
  .replace('/*APP*/', () => src('app.js'));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('Built index.html (' + Math.round(html.length / 1024) + ' KB)');
