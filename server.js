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
const syncInfoPath = 'syncInfo.json';
let syncInfo = null;
let lastSyncDate = null;
let queue = [];

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

// Load syncInfo, create if doesn’t exist
if (!fs.existsSync(syncInfoPath)) {
  fs.writeFileSync(syncInfoPath, '{}', (err) => {
    if (err) return console.log('Error creating syncInfo:', err);
  });
}
fs.readFile(syncInfoPath, (err, content) => {
  if (err) return console.log('Error loading syncInfo:', err);
  syncInfo = JSON.parse(content);
  if (syncInfo.upQueue) queue = syncInfo.upQueue;
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
  currentTimers[timerIndex] = {...req.body};
  res.send(currentTimers[timerIndex]);
  console.log('update:', currentTimers[timerIndex]);
  saveSave();
  addToQueue('update', currentTimers[timerIndex]);
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

/**
 * Attempt to delete object with given id from given array.
 * @param {String} id
 * @param {Array} array
 * @return {Bool} true if object was deleted, false if not found.
 */
function tryDeleteObject(id, array) {
  const index = array.findIndex((t) => t.id === id);
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
  addToQueue('delete', JSON.parse(JSON.stringify(
    currentTimers.find((t) => t.id === req.body.id))));
  tryDeleteObject(req.body.id, currentTimers);
  res.send({deleted: req.body.id});
  saveSave();
});

app.post('/events', (req, res) => {
  syncDown();
  res.send({blah: 'blah'});
});

app.post('/syncUp', (req, res) => {
  syncUp();
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
    });
  }
}

/**
 * Save syncToken to file + date of sync.
 * @param {String} syncToken
 */
function saveSyncToken(syncToken) {
  const date = new Date();
  syncInfo.syncToken = syncToken;
  syncInfo.date = date;
  fs.writeFileSync(syncInfoPath, JSON.stringify(syncInfo), (err) => {
    if (err) return console.log('Error saving sync token:', err);
  });
}

/**
 * Save queue to file.
 */
function saveQueue() {
  syncInfo.upQueue = queue;
  fs.writeFileSync(syncInfoPath, JSON.stringify(syncInfo), (err) => {
    if (err) return console.log('Error saving upQueue:', err);
  });
}

/**
 * Sync down events from gcal.
 */
async function syncDown() {
  const calendar = await getCalendar();
  const initialParams = [calendar];

  // First check if we have a sync token and if so use it
  if (fs.existsSync(syncInfoPath)) {
    try {
      syncInfo = JSON.parse(fs.readFileSync(syncInfoPath));
      const syncToken = syncInfo.syncToken;
      if (syncToken) {
        initialParams.push(syncToken);
        console.log('sync token', syncToken);

        lastSyncDate = new Date(syncInfo.date);
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

/**
 * Sync up new, deleted, or updated timers to gcal.
 */
async function syncUp() {
  const calendar = await getCalendar();
  for (const [index, entry] of queue.entries()) {
    for (const [change, timer] of Object.entries(entry)) {
      if (change === 'delete') {
        console.log(`sync up delete: ${timer.id} - ${timer.title}`);
        calendar.events.delete(
          {calendarId: 'primary', eventId: timer.id}, (err, res) => {
            if (err) {
              console.log(`The API returned an error\
 while calling events.delete: ${err}`);
              // 410 error means the event was already deleted on server, so we
              //  need to remove it from queue so do not return in that case.
              if (err.code !== 410) return;
            }
            removeFromQueue(index);
          });
      } else if (change === 'new') {
        console.log(`sync up new: ${timer.id} - ${timer.title}`);
        const event = {
          summary: timer.title,
          description: timer.description,
          start: {dateTime: timer.start},
          end: {dateTime: timer.end},
        };
        calendar.events.insert(
          {calendarId: 'primary', resource: event}, (err, res) => {
            if (err) return console.log(
              `The API returned an error while calling events.insert: ${err}`);
            console.log(res.data);
            // Update the object to have the new gcal id
            timer.id = res.data.id;
            saveSave();
            removeFromQueue(index);
          });
      } else if (change === 'update') {
        console.log(`sync up update: ${timer.id} - ${timer.title}`);
        // Get and update existing event
        calendar.events.get(
          {calendarId: 'primary', eventId: timer.id}, (err, res) => {
            if (err) return console.log(
              `The API returned an error while calling events.get: ${err}`);
            const event = res.data;
            event.summary = timer.title || event.summary;
            event.description = timer.description || event.description;
            event.start = {dateTime: timer.start};
            event.end = {dateTime: timer.end};
            calendar.events.update(
              {calendarId: 'primary', eventId: timer.id, resource: event}
              , (err, res) => {
                if (err) return console.log(
                  `'The API returned an error\
 while calling events.update: ${err}`);
                console.log(res.data);
                removeFromQueue(index);
              });
          });
      }
    }
  }
}

/**
 * Add required gcal change to queue.
 * @param {String} typeOfChange : update, delete
 * @param {Object} timer
 */
function addToQueue(typeOfChange, timer) {
  console.log('queue', queue);
  // Only keep latest
  let staleUpdateIndex = -1;
  do {
    staleUpdateIndex = queue.findIndex(((t) =>
      t[typeOfChange].id === timer.id));
    if (staleUpdateIndex !== -1) {
      queue.splice(staleUpdateIndex, 1);
    }
  } while (staleUpdateIndex !== -1);

  // Not on gcal yet, so if delete ignore, otherwise new
  if (timer.id.length === 21) {
    if (typeOfChange === 'delete') {
      return;
    } else {
      queue.push({'new': timer});
      return;
    }
  }

  queue.push({[typeOfChange]: timer});
  saveQueue();
}

/**
 * Remove entry from up sync queue.
 * @param {Integer} index of entry to remove
 */
function removeFromQueue(index) {
  queue.splice(index, 1);
  saveQueue();
}
