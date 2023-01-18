import { JestConfigWithTsJest } from 'ts-jest';

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const jestConfig: JestConfigWithTsJest = {
  // collectCoverage: true,

  // Black magic to fix esm imports: https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Files that should run with native ESM
  extensionsToTreatAsEsm: ['.ts'],

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest/presets/default-esm',

  // The test environment that will be used for testing
  testEnvironment: 'node',
};

export default jestConfig;
