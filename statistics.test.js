const {talliesForYear} = require('./statistics');

const matchers = {'dev': ['^dev:']};
const save = {'y2021': {'m1': {'d1': [{'title': 'dev:hi',
                                       'start': '2021-11-02T08:14:06.000Z',
                                       'end': '2021-11-02T09:50:12.000Z'},
                                      {'title': 'ldev:',
                                       'start': '2021-11-02T08:14:06.000Z',
                                       'end': '2021-11-02T08:50:12.000Z'}],
                               'd30': [{'title': 'w: yogs',
                                        'start': '2021-11-02T08:14:06.000Z',
                                        'end': '2021-11-02T10:50:12.000Z'}]}},
              'y2022': {'m1': {'d1': [{'title': 'dev:hi',
                                       'start': '2021-11-02T08:14:06.000Z',
                                       'end': '2021-11-02T08:55:12.000Z'},
                                      {'title': 'ldev:',
                                       'start': '2021-11-02T08:14:06.000Z',
                                       'end': '2021-11-02T11:50:12.000Z'}]}}};

test('tallies with 1 group and 1 matching timer', () => {
  expect(talliesForYear(2021, save, matchers))
    .toStrictEqual({'dev': {'tally': 1, 'seconds': 5766}});
});

test('tallies with 2 different groups', () => {
  matchers['w'] = ['^w:'];
  expect(talliesForYear(2021, save, matchers))
    .toStrictEqual({'dev': {'tally': 1, 'seconds': 5766},
                    'w': {'tally': 1, 'seconds': 9366}});
  delete matchers['w'];
});

test('tallies with 2 matching timers', () => {
  save['y2021']['m1']['d2'] = [{'title': 'dev: bye',
                                'start': '2021-11-02T08:14:06.000Z',
                                'end': '2021-11-02T09:50:12.000Z'}];
  expect(talliesForYear(2021, save, matchers))
    .toStrictEqual({'dev': {'tally': 2, 'seconds': 5766 * 2}});
});
