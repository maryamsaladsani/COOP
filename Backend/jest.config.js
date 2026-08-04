module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup/testEnv.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  testTimeout: 15000,
  // Run test files serially — they share one SQLite file (test.db) and reset it between
  // files; parallel workers would race on the same file and clobber each other's state.
  maxWorkers: 1,
};
