const express = require('express');
const Bottleneck = require('bottleneck/es5');

const authentication = require('./authentication');
const {getYearMonthDay, getDateStr} = require('./utils');
const {removeFromQueue} = require('./queue');
const {getCurrentTimers} = require('./timers');

const {
  getDayArray,
  tryDeleteTimerFromSave,
  tryUpdateTimerId,
} = require('./save-structure');

const {
  getQueue,
  saveSave,
  backupAndResetSave,
  getSyncToken,
  saveSyncToken,
} = require('./save');

const router = new express.Router();

const limiter = new Bottleneck({
  maxConcurrent: 10, minTime: 10, reservoir: 10
});
limiter.on('executing', (info) => {
  setTimeout(() => limiter.incrementReservoir(1), 1000);
});
const schedule = async (f, ...args) => limiter.schedule(() => f(...args));


const getCalendar = () => {
  return authentication.getCalendar();
};

/**
 * Call calendar.events.list and return the results.
 * @param {Object} calendar -- required
 * @param {String} syncToken -- optional
 * @param {String} pageToken -- optional
 */
async function getEvents(calendar, syncToken, pageToken) {
  const listParams = {
    calendarId: 'primary',
    singleEvents: true,
  };
  if (syncToken) listParams.syncToken = syncToken;
  if (pageToken) listParams.pageToken = pageToken;

  try {
    return await calendar.events.list(listParams);
  } catch (e) {
    console.log(`The API returned an error while calling events.list: ${e}`);
    if (syncToken && e.code === 410) { // sync token expired
      await handleSyncTokenExpired();
    }
  }
}

/**
 * Put events from gcal into our data.
 * @param {Array} events
 */
function storeNewEvents(events) {
  for (const event of events) {
    tryDeleteTimerFromSave(event.id);
    if (event.status === 'cancelled') {
      console.log('storeNewEvents: event.status cancelled');
      continue;
    }
    const start = new Date(event.start.dateTime);
    const dayArray = getDayArray(...getYearMonthDay(start));
    const timer = {
      id: event.id,
      start: start.toJSON(),
      title: event.summary,
      description: event.description || '',
    };
    if (event.end) timer.end = new Date(event.end.dateTime).toJSON();
    dayArray.push(timer);
  }
}

/**
 * Sync down events from gcal.
 */
async function syncDown() {
  const calendar = await getCalendar();
  const initialParams = [calendar];

  // First check if we have a sync token and if so use it
  const syncToken = getSyncToken();
  if (syncToken != null) {
    initialParams.push(syncToken);
    console.log('sync token', syncToken);
  } else {
    // Otherwise, indicate we don’t have it
    initialParams.push(null);
  }

  let nextPageToken = null;
  do {
    const params = [...initialParams];
    if (nextPageToken) params.push(nextPageToken);
    const res = await getEvents(...params);
    if (res) {
      storeNewEvents(res.data.items);
      if (res.data.nextSyncToken) saveSyncToken(res.data.nextSyncToken);
      if (res.data.nextPageToken) {
        nextPageToken = res.data.nextPageToken;
        console.log('next', nextPageToken);
      } else {
        console.log('no res.data.nextPageToken');
        break;
      }
    }
  } while (nextPageToken);

  saveSave();
  return console.log('done syncDown');
}

/**
 * Handle sync token expired
 * Back up save, create new one, and sync down from scratch
 */
async function handleSyncTokenExpired() {
  const backupFileName = `save_${getDateStr(new Date())}_backup.json`;
  console.log(`Sync token expired. Backing up old save to ${backupFileName}\
 and creating a new one`);
  backupAndResetSave(backupFileName);
  console.log('handleSyncTokenExpired: Syncing down all events from scratch');
  // Nullify sync token
  saveSyncToken(null);
  // Sync down all events from scratch (no sync token)
  await syncDown();
  // Reapply queue to save (add timers that haven’t yet been synced up)
  // NOTE: Doesn’t account for 'delete' items; only adds/updates. In
  //  theory sync down should only happen after sync up so the queue
  //  should not have any 'delete' items.
  // TODO: Add a check that that is indeed the case
  console.log('handleSyncTokenExpired: Reapplying queue timers');
  const queue = await getQueue();
  const events = [];
  for (const item of queue) {
    const timer = Object.values(item)[0];
    const event = {id: timer.id, status: 'confirmed',
                   start: {dateTime: timer.start},
                   summary: timer.title};
    if (timer.end) event.end = {dateTime: timer.end};
    if (timer.description) event.description = timer.description;
    events.push(event);
  }
  storeNewEvents(events);
}

/**
 * Delete timer’s corresponding gcal event from calendar.
 * @param {Object} calendar
 * @param {Object} timer
 */
async function deleteEvent(calendar, timer) {
  await calendar.events.delete({calendarId: 'primary', eventId: timer.id});
  return console.log(`deleteEvent ${timer.id}`);
}

/**
 * Add a corresponding gcal event for timer to calendar. Change timer’s id
 *  to match the new event id.
 * @param {Object} calendar
 * @param {Object} timer
 * @return {Promise}
 */
async function insertEvent(calendar, timer) {
  const event = {
    summary: timer.title,
    description: timer.description,
    start: {dateTime: timer.start},
    end: {dateTime: timer.end},
  };
  const res = await calendar.events.insert({calendarId: 'primary',
                                            resource: event});
  return res.data.id;
}

/**
 * Update timer’s corresponding gcal event on calendar to match timer.
 * @param {Object} calendar
 * @param {Object} timer
 */
async function updateEvent(calendar, timer) {
  // Get and update existing event
  const res = await calendar.events.get({calendarId: 'primary',
                                         eventId: timer.id});
  const event = res.data;
  event.summary = timer.title || event.summary;
  event.description = timer.description || event.description;
  event.start = {dateTime: timer.start};
  event.end = {dateTime: timer.end};
  await calendar.events.update({calendarId: 'primary',
                                eventId: timer.id, resource: event});
  return console.log(`updateEvent ${res.data.id}`);
}

/**
 * Sync up new, deleted, or updated timers to gcal.
 */
async function syncUp() {
  /**
   * If timer does not have an end time, do not try to sync it.
   * @param {Object} timer
   * @param {Function} reject function of the promise
   * @return {Bool} true if skipped, false if not. This is so that I can check
   *   this value and return if the timer was skipped.
   */
  function maybeSkipRunningTimer(timer, reject) {
    if (timer.end == null) {
      const msg = `not syncing running timer ${timer.id} - ${timer.title}`;
      console.log(msg);
      reject(msg);
      return true;
    }
    return false;
  }

  const calendar = await getCalendar();
  const queue = await getQueue();
  const promises = queue.map((entry, index) => {
    const [change, timer] = Object.entries(entry)[0];
    return new Promise((resolve, reject) => {
      if (change === 'delete') {
        console.log(`sync up delete: ${timer.id} - ${timer.title}`);
        schedule(deleteEvent, calendar, timer)
          .then((v) => resolve(index))
          .catch((e) => {
            console.log(`The API returned an error\
 while calling events.delete: ${e}`);
            if (e.code !== 410) {
              reject(e);
            } else {
              // 410 error means the event was already deleted on server, so we
              //  need to remove it from queue so do not return in that case.
              resolve(index);
            }
          });
      } else if (change === 'new') {
        if (maybeSkipRunningTimer(timer, reject)) return;
        console.log(`sync up new: ${timer.id} - ${timer.title}`);
        schedule(insertEvent, calendar, timer)
          .then((v) => {
            tryUpdateTimerId(timer, v);
            resolve(index);
          })
          .catch((e) => {
            console.log(
              `The API returned an error while calling events.insert: ${e}`);
            reject(e);
          });
      } else if (change === 'update') {
        if (maybeSkipRunningTimer(timer, reject)) return;
        console.log(`sync up update: ${timer.id} - ${timer.title}`);
        schedule(updateEvent, calendar, timer)
          .then((v) => resolve(index))
          .catch((e) => {
            console.log(`The API returned an error\
 while calling events.get or events.update: ${e}`);
            reject(e);
          });
      }
    });
  });

  const settle = () => Promise.allSettled(promises).then((results) => {
    // These are the indices for the entries we need to remove from the
    //  queue. The reason for sorting in reverse order is because otherwise each
    //  entry removed from the queue would affect the indices of the other ones.
    const indices = results.flatMap((result) =>
      (result.status === 'fulfilled') ? [result.value] : []
    );
    indices.sort((a, b) => b - a);
    for (const index of indices) removeFromQueue(index);
  });

  await settle();
  saveSave();
  return console.log('done syncUp');
}

/**
 * Sync up and down
 */
async function sync() {
  // TODO: Have some sort of limit/error to prevent infinite loop if something
  //  went wrong
  let yetToSyncUp = 0;
  do {
    if (yetToSyncUp) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // sleep
      yetToSyncUp = 0;
    }
    await syncUp();
    const queue = await getQueue();
    if (queue.length) {
      for (const item of queue) {
        const timer = Object.values(item)[0];
        if (timer.end != null) yetToSyncUp++;
      }
    }
  } while (yetToSyncUp);

  await syncDown();
}

router.post('/sync', async (req, res) => {
  await sync();
  res.send(getCurrentTimers());
});

router.post('/down', async (req, res) => {
  await syncDown();
  res.send(getCurrentTimers());
});

router.post('/up', async (req, res) => {
  await syncUp();
  res.send(getCurrentTimers());
});

router.get('/countQueue', async (req, res) => {
  const queue = await getQueue();
  res.send(queue.length.toString());
});


module.exports = {router, syncUp, syncDown};
