// Pin deterministic environment for tests. This runs (via jest `setupFiles`)
// BEFORE any application module is required, so when jwt.js / errorUtils.js call
// `dotenv.config()` later, dotenv will NOT override these already-set values.
//
// MODE is deliberately NOT "dev": that keeps the logger silent during tests and
// makes errorHandler mask 5xx messages — the production behavior we want to assert.

process.env.MODE = "test";
process.env.NODE_ENV = "test";

process.env.ACCESS_TOKEN = "test_access_token_secret";
process.env.REFRESH_TOKEN = "test_refresh_token_secret";

// Storage destinations are referenced by static routes and model hooks.
// Integration tests mock the filesystem layer, so these are just placeholders.
process.env.BUNDLED_PROJECT_DEST = "tests/.tmp/bundles";
process.env.USER_FILE_DEST = "tests/.tmp/user_files";
process.env.PROJECT_FILE_DEST = "tests/.tmp/project_files";

process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
