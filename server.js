const fs = require('fs');
const express = require('express');
const nanoid = require('nanoid').nanoid;
const bodyParser = require('body-parser');

let currentTimers = [];
let save = null;
const saveFilePath = 'save.json';

// Load save, create if doesn’t exist
if (!fs.existsSync(saveFilePath)) {
  fs.writeFileSync(saveFilePath, '{}', (err) => {
    if (err) return console.log('Error creating save:', err);
  });
}
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

/**
 * Get year, month, day from a Date object.
 * @param {Date} date
 * @return {Array} [year, month, day]
 */
function getYearMonthDay(date) {
  return [date.getFullYear(),
          (date.getMonth() + 1),
          date.getDate()];
}

/**
 * Update currentTimers to array in save.year.month.day and return it.
 * @param {Integer} year
 * @param {Integer} month
 * @param {Integer} day
 * @return {Array} currentTimers
 */
function updateCurrentTimers(year, month, day) {
  const y = 'y' + year;
  const m = 'm' + month;
  const d = 'd' + day;
  if (!save[y]) save[y] = {};
  if (!save[y][m]) save[y][m] = {};
  if (!save[y][m][d]) save[y][m][d] = [];
  currentTimers = save[y][m][d];
  return currentTimers;
}

/**
 * Save save file
 */
function saveSave() {
  fs.writeFile(saveFilePath, JSON.stringify(save, null, 2),
               function writeJSON(err) {
                 if (err) return console.log('Error saving save:', err);
               });
}

app.get('/day/:year-:month-:day', (req, res) => {
  const p = req.params;
  res.send(updateCurrentTimers(p.year, p.month, p.day));
});

app.post('/timerUpdate', (req, res) => {
  const timerIndex = currentTimers.findIndex(((t) => t.id === req.body.id));
  currentTimers[timerIndex] = {...req.body};
  res.send(currentTimers[timerIndex]);
  console.log('update:', currentTimers[timerIndex]);
  saveSave();
});

app.post('/timerAdd', (req, res) => {
  const p = req.body;
  updateCurrentTimers(...getYearMonthDay(new Date(p.start)));
  currentTimers.push({id: nanoid(), title: p.title,
                      start: p.start});
  res.send(currentTimers);
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
