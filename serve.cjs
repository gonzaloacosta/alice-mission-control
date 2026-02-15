const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/{*splat}', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(4445, '0.0.0.0', () => console.log('MC Pro on :4445'));
