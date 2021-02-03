const fs = require('fs');
const express = require('express');
const nanoid = require('nanoid').nanoid;
const bodyParser = require('body-parser');

let timerData = []; // probably should be renamed
let save = null;
const saveFilePath = 'save.json';

// Load save
fs.readFile(saveFilePath, (err, content) => {
  if (err) return console.log('Error loading save:', err);
  save = JSON.parse(content);
  timerData = save.y2021.m1.d1;
});

// Set up express and io
const app = module.exports.app = express();
const port = process.env.PORT || 3003;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const server = app.listen(port, () => console.log(`Listening on port ${port}`));
const io = module.exports.io = require('socket.io')(server);

io.on('connection', function(socket) {
  console.log('a user connected');
  // Load client secrets from a local file.
  // fs.readFile('credentials.json', (err, content) => {
  //   if (err) return console.log('Error loading client secret file:', err);
  //   // Pass on to client
  //   io.emit('credentials', JSON.parse(content).web);
  // });
});

app.get('/timerData', (req, res) => {
  res.send(timerData);
});

/**
 * Save save file
 */
function saveSave() {
  fs.writeFile(saveFilePath, JSON.stringify(save, null, 2),
               function writeJSON(err) {
                 if (err) return console.log('Error saving save:', err);
               });
}

app.post('/timerUpdate', (req, res) => {
  const timerIndex = timerData.findIndex(((t) => t.id === req.body.id));
  timerData[timerIndex] = {...req.body};
  res.send(timerData[timerIndex]);
  console.log('update:', timerData[timerIndex]);
  saveSave();
});

app.post('/timerAdd', (req, res) => {
  const now = new Date();
  timerData.push({id: nanoid(), title: req.body.title, start: now});
  res.send(timerData[timerData.length - 1]);
  console.log('new:', timerData[timerData.length - 1]);
  saveSave();
});
