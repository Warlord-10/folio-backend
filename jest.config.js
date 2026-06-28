module.exports = {
    testEnvironment: "node",

    // Runs before each test file's module registry is set up — used to pin
    // deterministic env vars (JWT secrets, MODE) before any app code reads them.
    setupFiles: ["<rootDir>/tests/setup/env.js"],

    // Source is plain CommonJS for Node 22 — no Babel/TS transform needed.
    // (Disabling transform also stops Jest from picking up the React .babelrc.)
    transform: {},

    testMatch: ["**/tests/**/*.test.js"],

    // Don't let a forgotten open handle (socket, timer) hang the run silently.
    forceExit: false,

    coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
};
