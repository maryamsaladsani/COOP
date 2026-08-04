// Runs before the test framework loads (Jest `setupFiles`) — must load the isolated test
// env BEFORE any app code (src/config/env.js) gets required anywhere, since that module
// validates required vars at import time and calls process.exit(1) if any are missing.
// Points at a completely separate SQLite file (test.db) and uploads dir (uploads-test/) so
// tests never touch dev.db or real uploaded documents.
require("dotenv").config({ path: require("path").join(__dirname, "../../.env.test") });
