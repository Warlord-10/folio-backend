// Verifies the central error-handling pipeline behaves correctly over real HTTP,
// and that a healthy route still works (the happy path through the same stack).

jest.mock("../../services/redis.js");
jest.mock("../../services/rabbitmq.js");
jest.mock("../../services/pubSubService.js");
jest.mock("../../utils/fileManager.js", () => ({
    createFolder: jest.fn(),
    removeFolder: jest.fn(),
    createFile: jest.fn(),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const db = require("../setup/db");
const app = require("../../app.js");

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.close());

describe("healthy route", () => {
    it("GET /test returns 200", async () => {
        const res = await request(app).get("/test");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ msg: "hello" });
    });
});

describe("not-found resource", () => {
    it("GET /user/s/:uid for an absent (but valid) id returns a clean 404 JSON error", async () => {
        const missingId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).get(`/user/s/${missingId}`);

        expect(res.status).toBe(404);
        // Consistent shape from AppError -> errorHandler, not a bare string or HTML.
        expect(res.body.error).toBe("User not found");
    });
});
