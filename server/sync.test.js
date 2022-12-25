const {syncUp} = require('./sync');
const authentication = require('./authentication');
const save = require('./save');
const queue = require('./queue'); // eslint-disable-line no-unused-vars

jest.mock('./authentication');
jest.mock('./save');
jest.mock('./queue');

const dummyUpQueueItemFields = {
    'id': '5gcISU445OBQnpv_3ZLkz',
    'start': '2022-12-06T22:18:06.849Z', 'end': '2022-12-06T22:19:06.849Z',
    'title': 'dev: eisenhour', 'description': ''
};

const generateDummyUpQueue = (length=1, modifications={}) => {
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
};

const mockQueue = (...generateDummyUpQueueArgs) => {
  const queue = generateDummyUpQueue(...generateDummyUpQueueArgs);
  save.getQueue.mockReturnValue(queue);
};

const calendar = {
  events: {get: jest.fn(), insert: jest.fn(), delete: jest.fn(),
           update: jest.fn()}
};

const expectEvents = (get, insert, delete_, update) => {
  expect(calendar.events.get).toHaveBeenCalledTimes(get);
  expect(calendar.events.insert).toHaveBeenCalledTimes(insert);
  expect(calendar.events.delete).toHaveBeenCalledTimes(delete_);
  expect(calendar.events.update).toHaveBeenCalledTimes(update);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


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
