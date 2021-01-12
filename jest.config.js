module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
};
