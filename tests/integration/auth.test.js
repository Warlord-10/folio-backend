// End-to-end HTTP tests for the auth routes, driving the FULL middleware stack
// (body parsing, rate limiter, soft-auth default, controller, asyncHandler, and
// the central errorHandler) against a real in-memory MongoDB.

// External services and the filesystem are mocked so the app boots without
// Redis / RabbitMQ / disk. These must be declared before requiring app.js.
jest.mock("../../services/redis.js");
jest.mock("../../services/rabbitmq.js");
jest.mock("../../services/pubSubService.js");
jest.mock("../../utils/fileManager.js", () => ({
    createFolder: jest.fn(),
    removeFolder: jest.fn(),
    createFile: jest.fn(),
}));

const request = require("supertest");
const db = require("../setup/db");
const { __clearStore } = require("../../services/redis.js");
const app = require("../../app.js");
const UserModel = require("../../models/user.js");

beforeAll(() => db.connect());
afterEach(async () => {
    await db.clear();
    __clearStore(); // wipe the mocked Redis session store between tests
});
afterAll(() => db.close());

const validUser = { name: "Ada", email: "ada@example.com", password: "secret123" };

// Helper: extract a cookie value from a set-cookie header array.
function getCookie(res, name) {
    const header = res.headers["set-cookie"] || [];
    return header.find((c) => c.startsWith(`${name}=`));
}

describe("POST /auth/register", () => {
    it("creates a user, returns 201, and sets auth cookies", async () => {
        const res = await request(app).post("/auth/register").send(validUser);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("User registered successfully");
        expect(res.body.user.email).toBe(validUser.email);
        expect(res.body.user.password).toBeUndefined(); // toJSON strips it
        expect(getCookie(res, "accessToken")).toBeDefined();
        expect(getCookie(res, "refreshToken")).toBeDefined();

        // Password is stored hashed, never in plaintext.
        const stored = await UserModel.findOne({ email: validUser.email }).select("+password");
        expect(stored.password).not.toBe(validUser.password);
    });

    it("returns 400 when a field is missing (AppError -> errorHandler)", async () => {
        const res = await request(app).post("/auth/register").send({ email: "x@y.com" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("All fields are required");
    });

    it("returns 409 on a duplicate email", async () => {
        await request(app).post("/auth/register").send(validUser);
        const res = await request(app).post("/auth/register").send(validUser);

        expect(res.status).toBe(409);
        expect(res.body.error).toBe("Email already in use");
    });
});

describe("POST /auth/login", () => {
    beforeEach(async () => {
        await request(app).post("/auth/register").send(validUser);
    });

    it("logs in with correct credentials and sets cookies", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({ email: validUser.email, password: validUser.password });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Login successful");
        expect(getCookie(res, "accessToken")).toBeDefined();
    });

    it("returns 401 for a wrong password", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({ email: validUser.email, password: "wrong" });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Incorrect password");
    });

    it("returns 404 for an unknown email", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({ email: "nobody@example.com", password: "secret123" });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("User not found");
    });
});

describe("POST /auth/refresh", () => {
    it("returns 401 with a code when no refresh token is present", async () => {
        const res = await request(app).post("/auth/refresh");

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("REFRESH_TOKEN_EXPIRED");
    });

    it("issues a fresh access token from a valid refresh cookie", async () => {
        const reg = await request(app).post("/auth/register").send(validUser);
        const refreshCookie = getCookie(reg, "refreshToken");

        const res = await request(app).post("/auth/refresh").set("Cookie", refreshCookie);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Token refreshed successfully");
        expect(getCookie(res, "accessToken")).toBeDefined();
    });

    it("rejects a refresh token whose session was never stored (signature valid, not on record)", async () => {
        const reg = await request(app).post("/auth/register").send(validUser);
        const refreshCookie = getCookie(reg, "refreshToken");

        // Simulate the session being gone server-side (e.g. revoked / expired in Redis).
        __clearStore();

        const res = await request(app).post("/auth/refresh").set("Cookie", refreshCookie);
        expect(res.status).toBe(401);
        expect(res.body.code).toBe("REFRESH_TOKEN_EXPIRED");
    });
});

describe("stateful session: logout revokes server-side", () => {
    it("a refresh token can no longer be used after logout", async () => {
        const reg = await request(app).post("/auth/register").send(validUser);
        const refreshCookie = getCookie(reg, "refreshToken");

        // Logout deletes the stored session.
        const logout = await request(app).post("/auth/logout").set("Cookie", refreshCookie);
        expect(logout.status).toBe(200);

        // The (still cryptographically valid) refresh token is now useless.
        const res = await request(app).post("/auth/refresh").set("Cookie", refreshCookie);
        expect(res.status).toBe(401);
        expect(res.body.code).toBe("REFRESH_TOKEN_EXPIRED");
    });
});

describe("stateful session: rotation + reuse detection", () => {
    it("rotates the refresh token and invalidates the old one on reuse", async () => {
        const reg = await request(app).post("/auth/register").send(validUser);
        const oldRefresh = getCookie(reg, "refreshToken");

        // First refresh succeeds and rotates to a new refresh token.
        const first = await request(app).post("/auth/refresh").set("Cookie", oldRefresh);
        expect(first.status).toBe(200);
        const newRefresh = getCookie(first, "refreshToken");
        expect(newRefresh).toBeDefined();

        // Replaying the OLD refresh token is now rejected (reuse detected).
        const replay = await request(app).post("/auth/refresh").set("Cookie", oldRefresh);
        expect(replay.status).toBe(401);
        expect(replay.body.code).toBe("REFRESH_TOKEN_EXPIRED");
    });
});
