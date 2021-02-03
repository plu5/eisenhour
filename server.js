const fs = require('fs');
const get = require('lodash.get');
const express = require('express');
const nanoid = require('nanoid').nanoid;
const bodyParser = require('body-parser');

let currentTimers = [];
let save = null;
const saveFilePath = 'save.json';

// Load save
fs.readFile(saveFilePath, (err, content) => {
  if (err) return console.log('Error loading save:', err);
  save = JSON.parse(content);
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

app.get('/day/:year-:month-:day', (req, res) => {
  currentTimers = get(save, 'y' + req.params.year + '.m' +
                      req.params.month + '.d' + req.params.day);
  if (!currentTimers) currentTimers = [];
  res.send(currentTimers);
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
  const timerIndex = currentTimers.findIndex(((t) => t.id === req.body.id));
  currentTimers[timerIndex] = {...req.body};
  res.send(currentTimers[timerIndex]);
  console.log('update:', currentTimers[timerIndex]);
  saveSave();
});

app.post('/timerAdd', (req, res) => {
  currentTimers.push({id: nanoid(), title: req.body.title,
                      start: req.body.start});
  res.send(currentTimers[currentTimers.length - 1]);
  console.log('new:', currentTimers[currentTimers.length - 1]);
  saveSave();
});

app.post('/timerDelete', (req, res) => {
  const timerIndex = currentTimers.findIndex(((t) => t.id === req.body.id));
  console.log('delete:', currentTimers[timerIndex]);
  currentTimers.splice(timerIndex, 1);
  res.send({deleted: req.body.id});
  saveSave();
});
