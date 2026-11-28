// Tests can be added in the aw-webui/test folder
// File names that end with .test.ts will be run in the jsdom testEnvironment
// File names that end with .test.node.ts will be run in the node testEnvironment

// Packages that ship ES modules only. babel-jest compiles them to CommonJS.
const esmPackages = [
  'vue-awesome',
  'color',
  'color-convert',
  'color-name',
  'color-string',
  '@unicode/unicode-13\\.0\\.0',
];
const transformIgnorePatterns = [`/node_modules/(?!(${esmPackages.join('|')})/)`];

module.exports = {
  // CPU-derived defaults overcommit memory in containers on high-core hosts.
  // Keep a bounded default; developers can still override it with --maxWorkers.
  maxWorkers: 2,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,ts}'],
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/test/jest-setup.js'],
      transform: {
        '^.+\\.m?js$': 'babel-jest',
        '^.+\\.ts$': 'ts-jest',
        '^.+\\.vue$': '@vue/vue2-jest',
      },
      transformIgnorePatterns,
      testMatch: ['**/test/**/*.test.{js,ts}?(x)'],
      moduleNameMapper: {
        '^~/(.+)$': '<rootDir>/src/$1',
        '\\.css$': '<rootDir>/test/helpers/styleStub.js',
        '^d3$': '<rootDir>/node_modules/d3/dist/d3.min.js',
      },
      moduleFileExtensions: ['js', 'mjs', 'ts', 'vue', 'json'],
      modulePathIgnorePatterns: ['test/e2e/screenshot.test.ts'], // Don't run this file in npm test
    },
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/test/**/*.test.node.{js,ts}?(x)'],
      transform: {
        '^.+\\.m?js$': 'babel-jest',
        '^.+\\.ts$': 'ts-jest',
        '^.+\\.vue$': '@vue/vue2-jest',
      },
      transformIgnorePatterns,
      moduleNameMapper: {
        '^~/(.+)$': '<rootDir>/src/$1',
        '\\.css$': '<rootDir>/test/helpers/styleStub.js',
        '^d3$': '<rootDir>/node_modules/d3/dist/d3.min',
      },
    },
  ],
};
