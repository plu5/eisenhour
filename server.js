const fs = require('fs');
const express = require('express');
const nanoid = require('nanoid').nanoid;
const bodyParser = require('body-parser');

const authentication = require('./authentication');

// Set up express and io
const app = module.exports.app = express();
const port = process.env.PORT || 3003;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const server = app.listen(port, () => console.log(`Listening on port ${port}`));
const io = module.exports.io = require('socket.io')(server);

app.use('/authentication', authentication.router);

const getCalendar = () => {
  return authentication.getCalendar();
};

io.on('connection', function(socket) {
  console.log('a user connected');
  // Load client secrets from a local file.
  // fs.readFile('credentials.json', (err, content) => {
  //   if (err) return console.log('Error loading client secret file:', err);
  //   // Pass on to client
  //   io.emit('credentials', JSON.parse(content).web);
  // });
});

let currentTimers = [];
let save = null;
const saveFilePath = 'save.json';
const syncTokenPath = 'synctoken.json';

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
 * Return keys in the save file for year, month, day, verifying the structure
 *  exists in the save file and creating it if not.
 * @param {Integer} year
 * @param {Integer} month
 * @param {Integer} day
 * @return {Array} keys for year, month, day
 */
function getSaveKeysAndVerifyStructureFor(year, month, day) {
  const y = 'y' + year;
  const m = 'm' + month;
  const d = 'd' + day;
  if (!save[y]) save[y] = {};
  if (!save[y][m]) save[y][m] = {};
  if (!save[y][m][d]) save[y][m][d] = [];
  return [y, m, d];
}

/**
 * Return the save array for the given day.
 * @param {Integer} year
 * @param {Integer} month
 * @param {Integer} day
 * @return {Array} array of timers for given save day
 */
function getSaveDayArray(year, month, day) {
  const [y, m, d] = getSaveKeysAndVerifyStructureFor(year, month, day);
  return save[y][m][d];
}

/**
 * Update currentTimers to array in save.year.month.day and return it.
 * @param {Integer} year
 * @param {Integer} month
 * @param {Integer} day
 * @return {Array} currentTimers
 */
function updateCurrentTimers(year, month, day) {
  currentTimers = getSaveDayArray(year, month, day);
  return currentTimers;
}

/**
 * Save save file
 */
function saveSave() {
  fs.writeFile(saveFilePath, JSON.stringify(save, null, 2), (err) => {
    if (err) return console.log('Error saving save:', err);
  });
}

app.get('/day/:year-:month-:day', (req, res) => {
  const p = req.params;
  res.send(updateCurrentTimers(p.year, p.month, p.day));
});

app.post('/timerUpdate', (req, res) => {
  const timerIndex = currentTimers.findIndex(((t) => t.id === req.body.id));
  currentTimers[timerIndex] = {...req.body, par_with_remote: false};
  res.send(currentTimers[timerIndex]);
  console.log('update:', currentTimers[timerIndex]);
  saveSave();
});

app.post('/timerAdd', (req, res) => {
  const p = req.body;
  updateCurrentTimers(...getYearMonthDay(new Date(p.start)));
  currentTimers.push({id: nanoid(), title: p.title,
                      start: p.start, par_with_remote: false});
  res.send(currentTimers);
  console.log('new:', currentTimers[currentTimers.length - 1]);
  saveSave();
});

/**
 * Attempt to delete object with given id from given array.
 * @param {String} id
 * @param {Array} array
 * @return {Bool} true if object was deleted, false if not found.
 */
function tryDeleteObject(id, array) {
  const index = array.findIndex(((t) => t.id === id));
  if (index !== -1) {
    console.log('delete:', array[index]);
    array.splice(index, 1);
    return true;
  } else {
    // console.log(`tryDeleteTimer failed; couldn’t find timer with id ${id}`);
    return false;
  }
}

/**
 * Attempt to delete timer with given id from the entire save.
 * @param {String} id
 * @return {Bool} true if object was deleted, false if not found.
 */
function tryDeleteTimerFromSave(id) {
  for (const [, year] of Object.entries(save)) {
    for (const [, month] of Object.entries(year)) {
      for (const [, day] of Object.entries(month)) {
        if (tryDeleteObject(id, day)) {
          return true;
        }
      }
    }
  }
  return false;
}

app.post('/timerDelete', (req, res) => {
  tryDeleteObject(req.body.id, currentTimers);
  res.send({deleted: req.body.id});
  saveSave();

  // TODO: some way to mark we need to delete on remote
});

app.post('/events', (req, res) => {
  syncDown();
  res.send({blah: 'blah'});
});

/**
 * Call calendar.events.list and return the results.
 * @param {Object} calendar -- required
 * @param {String} syncToken -- optional
 * @param {String} pageToken -- optional
 */
async function getEvents(calendar, syncToken, pageToken) {
  return new Promise((resolve) => {
    const listParams = {
      calendarId: 'primary',
      singleEvents: true,
    };
    if (syncToken) listParams.syncToken = syncToken;
    if (pageToken) listParams.pageToken = pageToken;

    calendar.events.list(listParams, (err, res) => {
      if (err) return console.log(
        'The API returned an error while calling events.list: ' + err);
      resolve(res);
    });
  });
}

/**
 * Put events from gcal into our data.
 * @param {Array} events
 */
function eventsToData(events) {
  for (const event of events) {
    // If deleted
    if (event.status === 'cancelled') {
      tryDeleteTimerFromSave(event.id);
      break;
    }
    // If update to an event we already have
    const updateDate = new Date(event.updated);
    if (updateDate > lastSyncDate) {
      tryDeleteTimerFromSave(event.id);
    }
    const start = new Date(event.start.dateTime);
    const dayArray = getSaveDayArray(...getYearMonthDay(start));
    dayArray.push({
      id: event.id,
      start,
      end: new Date(event.end.dateTime),
      title: event.summary,
      description: event.details || '',
      par_with_remote: true,
    });
  }
}

/**
 * Save syncToken to file + date of sync.
 * @param {String} syncToken
 */
function saveSyncToken(syncToken) {
  const date = new Date();
  fs.writeFileSync(syncTokenPath, JSON.stringify({syncToken, date}), (err) => {
    if (err) return console.log('Error saving sync token:', err);
  });
}

let lastSyncDate;

/**
 * Sync down events from gcal.
 */
async function syncDown() {
  const calendar = await getCalendar();
  const initialParams = [calendar];

  // First check if we have a sync token and if so use it
  if (fs.existsSync(syncTokenPath)) {
    try {
      const parsedContents = JSON.parse(fs.readFileSync(syncTokenPath));
      const syncToken = parsedContents.syncToken;
      if (syncToken) {
        initialParams.push(syncToken);
        console.log('sync token', syncToken);

        lastSyncDate = new Date(parsedContents.date);
      } else {
        initialParams.push(null);
      }
    } catch (err) {
      return console.log('Error loading sync token:', err);
    }
  } else {
    // Otherwise, indicate we don’t have it
    initialParams.push(null);
  }

  let nextPageToken = null;
  do {
    const params = [...initialParams];
    if (nextPageToken) params.push(nextPageToken);
    const res = await getEvents(...params);
    eventsToData(res.data.items);
    if (res.data.nextSyncToken) saveSyncToken(res.data.nextSyncToken);
    if (res.data.nextPageToken) {
      nextPageToken = res.data.nextPageToken;
      console.log('next', nextPageToken);
    } else {
      console.log('no res.data.nextPageToken');
      break;
    }
  } while (nextPageToken);

  console.log('done?');
  saveSave();
}
