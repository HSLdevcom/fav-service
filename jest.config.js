/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  silent: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFilesAfterEnv: ['./jest.setup.redis-mock.js'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$',
};
