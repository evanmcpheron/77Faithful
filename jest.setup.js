jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('./src/global.css', () => ({}));

require('react-native-reanimated').setUpTests();
