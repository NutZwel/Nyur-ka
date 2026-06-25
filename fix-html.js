// Fix dist/index.html for Electron file:// protocol
const fs = require('fs')
const path = require('path')

const htmlPath = path.join(__dirname, 'dist/index.html')
let html = fs.readFileSync(htmlPath, 'utf8')

// Remove crossorigin attribute — breaks file:// protocol
html = html.replace(/ crossorigin/g, '')

fs.writeFileSync(htmlPath, html)
console.log('✅ Fixed HTML crossorigin for file:// protocol')
