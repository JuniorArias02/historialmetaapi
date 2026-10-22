/** @type {import('jest').Config} */
const base = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
};

module.exports = {
  projects: [
    { ...base, displayName: 'unitarias', testMatch: ['<rootDir>/test/unitarias/**/*.spec.ts'] },
    {
      ...base,
      displayName: 'integracion',
      testMatch: ['<rootDir>/test/integracion/**/*.spec.ts'],
    },
  ],
};
