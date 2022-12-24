const {syncUp} = require('./sync');
const authentication = require('./authentication');
const save = require('./save');
const _ = require('./queue'); // eslint-disable-line no-unused-vars

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

const mockEventsFuncImplementation = (_, callback) => {
  callback(false, {data: {id: 'mock-id'}});
};

calendar.events.get.mockImplementation(mockEventsFuncImplementation);
calendar.events.insert.mockImplementation(mockEventsFuncImplementation);
calendar.events.delete.mockImplementation(mockEventsFuncImplementation);
calendar.events.update.mockImplementation(mockEventsFuncImplementation);

const expectEvents = (get, insert, delete_, update) => {
  expect(calendar.events.get).toHaveBeenCalledTimes(get);
  expect(calendar.events.insert).toHaveBeenCalledTimes(insert);
  expect(calendar.events.delete).toHaveBeenCalledTimes(delete_);
  expect(calendar.events.update).toHaveBeenCalledTimes(update);
};


describe('syncUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
