const {syncUp, syncDown} = require('./sync');
const authentication = require('./authentication');
const save = require('./save');
const queue = require('./queue'); // eslint-disable-line no-unused-vars
const {tryDeleteTimerFromSave, getDayArray} = require('./save-structure');
const {getYearMonthDay} = require('./utils');


jest.mock('./authentication');
jest.mock('./save');
jest.mock('./queue');

const dummyUpQueueItemFields = {
    'id': '5gcISU445OBQnpv_3ZLkz',
    'start': '2022-12-06T22:18:06.849Z', 'end': '2022-12-06T22:19:06.849Z',
    'title': 'dev: eisenhour', 'description': ''
};

/**
 * Generate dummy up queue
 * @param {int} length - Number of items in the up queue
 * @param {Object=} modifications - Optional modifications object. The format
 *   is a dictionary where each key is an integer representing the index of the
 *   item to modify
 * @return {Object} dummy up queue
 */
function generateDummyUpQueue(length=1, modifications={}) {
  const dummyUpQueue = [];
  for (let i = 0; i < length; i++) {
    let item = {'new': {...dummyUpQueueItemFields}};
    if (modifications[i]) {
      if (modifications[i].running) item.new.end = null;
      if (modifications[i].update) item = {
        'update': {...dummyUpQueueItemFields}};
      if (modifications[i].delete) item = {
        'delete': {...dummyUpQueueItemFields}};
    }
    dummyUpQueue.push(item);
  }
  return dummyUpQueue;
}

/**
 * Mock save.getQueue
 * @param {Object} ...generateDummyUpQueueArgs - Arguments generateDummyUpQueue
 *   takes
 */
function mockQueue(...generateDummyUpQueueArgs) {
  const queue = generateDummyUpQueue(...generateDummyUpQueueArgs);
  save.getQueue.mockReturnValue(queue);
}

/**
 * Generate dummy save
 * @param {int} length - Number of items in the save
 * @param {Object=} modifications - Optional modifications object. The format
 *   is a dictionary where each key is an integer representing the index of the
 *   item to modify, and each value is a dictionary with timer data items to
 *   modify. e.g. `{0: {title: 'new title', description: 'new description'}}`
 * @return {Object} dummy save
 */
function generateDummySave(length=1, modifications={}) {
  const dummySave = {};
  _mockSave(dummySave);
  for (let i = 0; i < length; i++) {
    const item = {...dummyUpQueueItemFields};
    if (modifications[i]) {
      for (const d of ['id', 'start', 'end', 'title', 'description'])
        if (modifications[i][d]) item[d] = modifications[i][d];
    }
    getDayArray(...getYearMonthDay(new Date(item.start)), dummySave)
      .push(item);
  }
  return dummySave;
}

// Doesn’t work when I put this in a function
jest.mock('./save-structure', () => {
  const originalModule = jest.requireActual('./save-structure');
  return {
    ...originalModule,
    tryDeleteTimerFromSave: jest.fn((id) => {
      originalModule.tryDeleteTimerFromSave(id, {});
    }),
    getDayArray: jest.fn(() => []),
  };
});

const _mockSave = (save_) => {
  save.getSave.mockReturnValue(save_);

  const originalModule = jest.requireActual('./save-structure');

  tryDeleteTimerFromSave.mockImplementation((id) =>
    originalModule.tryDeleteTimerFromSave(id, save_));

  getDayArray.mockImplementation((y, m, d, s) =>
    originalModule.getDayArray(y, m, d, save_));
};

/**
 * Mock save. Mocks:
 * - Return value of save.getSave to use a dummy save
 * - tryDeleteTimerFromSave to use the dummy save
 * - getDayArray to use the dummy save
 * @param {Object} ...generateDummySaveArgs - Arguments generateDummySave takes
 * @return {Object} dummy save
 */
function mockSave(...generateDummySaveArgs) {
  const save_ = generateDummySave(...generateDummySaveArgs);
  _mockSave(save_);
  return save_;
}

const calendar = {
  events: {get: jest.fn(), insert: jest.fn(), delete: jest.fn(),
           update: jest.fn()}
};

/**
 * Mock calendar.events.list
 * @param {Bool} err : Whether it should error
 * @param {Array} queueItems : List of items in eisenhour format. start and
 *   end time should be strings not dates. These items will be converted
 *   to gcal format and returned when calendar.events.list is called.
 */
function mockCalendarList(err, queueItems) {
  const items = [];
  for (const item of queueItems) {
    items.push({id: item.id, summary: item.title,
                start: {dateTime: item.start},
                end: {dateTime: item.end}});
  }
  calendar.events.list = (listParams, callback) => {
    callback(err, {data: {items}});
  };
}

const expectEvents = (get, insert, delete_, update) => {
  expect(calendar.events.get).toHaveBeenCalledTimes(get);
  expect(calendar.events.insert).toHaveBeenCalledTimes(insert);
  expect(calendar.events.delete).toHaveBeenCalledTimes(delete_);
  expect(calendar.events.update).toHaveBeenCalledTimes(update);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


/* ----- syncUp tests ----- */
describe('syncUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const f of [calendar.events.get, calendar.events.insert,
                     calendar.events.delete, calendar.events.update])
      f.mockResolvedValue({data: {id: 'mock-id'}});
    authentication.getCalendar.mockReturnValue(calendar);
  });
  it('skips running timer', async () => {
    mockQueue(1, {0: {running: true}});
    await syncUp();
    expectEvents(0, 0, 0, 0);
  });
  it('syncs deleted timer', async () => {
    mockQueue(1, {0: {delete: true}});
    await syncUp();
    expectEvents(0, 0, 1, 0);
  });
  it('syncs new timer', async () => {
    mockQueue(1);
    await syncUp();
    expectEvents(0, 1, 0, 0);
  });
  it('syncs updated timer', async () => {
    mockQueue(1, {0: {update: true}});
    await syncUp();
    expectEvents(1, 0, 0, 1);
  });
  it('handles promise rejection in case of server error', async () => {
    calendar.events.insert.mockImplementation(async (...args) => {
      await delay(100);
      throw new Error('Rate Limit Exceeded');
    });
    mockQueue(1);
    await syncUp();
    expect(queue.removeFromQueue).toHaveBeenCalledTimes(0);
  });
  it('bottlenecks insert operations to 10 per 1000ms', async () => {
    let callsCount = 0;
    let start = Date.now();
    let previous = null;
    calendar.events.insert.mockImplementation(async (...args) => {
      callsCount += 1;
      const now = Date.now();
      const resetCond = now + 0 > start + 1000;
      console.log(callsCount, previous ? now-previous : 0, now-start,
                  resetCond ? 'RESET' : '');
      previous = now;
      if (resetCond) {
        callsCount = 0;
        start = Date.now();
      }
      if (callsCount > 10) {
        throw new Error('Rate Limit Exceeded');
      } else {
        return {data: {id: dummyUpQueueItemFields.id}};
      }
    });
    mockQueue(15);
    await syncUp();
    expectEvents(0, 15, 0, 0);
    expect(queue.removeFromQueue).toHaveBeenCalledTimes(15);
  });
});


/* ----- syncDown tests ----- */
describe('syncDown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authentication.getCalendar.mockReturnValue(calendar);
  });
  it('syncs down 1 event into an empty save', async () => {
    const save_ = mockSave(0);
    const item = {...dummyUpQueueItemFields,
                  start: '2022-12-06T20:18:06.849Z'};
    mockCalendarList(false, [item]);
    await syncDown();
    expect(save_).toEqual({y2022: {m12: {d6: [item]}}});
  });
  it('updates existing timer whose event changed upstream', async () => {
    const start = '2022-12-06T20:18:06.849Z';
    const save_ = mockSave(1, {0: {start}});
    const item = {...dummyUpQueueItemFields, start};
    const updatedItem = {...item, end: '2022-12-06T20:19:06.849Z'};
    mockCalendarList(false, [updatedItem]);
    await syncDown();
    expect(save_).toEqual({y2022: {m12: {d6: [updatedItem]}}});
  });
});
