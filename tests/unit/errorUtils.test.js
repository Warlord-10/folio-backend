const { asyncHandler, errorHandler } = require("../../utils/errorUtils.js");
const { AppError } = require("../../utils/appError.js");

// Minimal Express res double.
function mockRes() {
    return {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
    };
}

describe("asyncHandler", () => {
    it("calls the wrapped handler and does not call next on success", async () => {
        const next = jest.fn();
        const handler = asyncHandler(async (req, res) => res.status(200).json({ ok: true }));
        const res = mockRes();

        await handler({}, res, next);

        expect(res.statusCode).toBe(200);
        expect(next).not.toHaveBeenCalled();
    });

    it("forwards a thrown error to next() (this is the whole point)", async () => {
        const next = jest.fn();
        const boom = new AppError(400, "bad");
        const handler = asyncHandler(async () => { throw boom; });

        await handler({}, mockRes(), next);

        expect(next).toHaveBeenCalledWith(boom);
    });

    it("forwards a rejected promise to next()", async () => {
        const next = jest.fn();
        const boom = new Error("rejected");
        const handler = asyncHandler(() => Promise.reject(boom));

        await handler({}, mockRes(), next);

        expect(next).toHaveBeenCalledWith(boom);
    });
});

describe("errorHandler", () => {
    it("uses the AppError status and message for client (4xx) errors", () => {
        const res = mockRes();
        errorHandler(new AppError(404, "User not found"), {}, res, jest.fn());

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("User not found");
    });

    it("includes a machine-readable code when present", () => {
        const res = mockRes();
        errorHandler(new AppError(401, "Expired", "ACCESS_TOKEN_EXPIRED"), {}, res, jest.fn());

        expect(res.body.code).toBe("ACCESS_TOKEN_EXPIRED");
    });

    it("defaults to status 500 and code null for an unhandled error", () => {
        const res = mockRes();
        errorHandler(new Error("boom"), {}, res, jest.fn());

        expect(res.statusCode).toBe(500);
        expect(res.body.code).toBeNull();
        // NOTE: the current handler passes err.message straight through on 500s.
        // See the security note in the summary about masking 5xx messages.
        expect(res.body.error).toBe("boom");
    });
});
