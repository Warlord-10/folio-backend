const { AppError } = require("../../utils/appError.js");

describe("AppError", () => {
    it("is a real Error subclass (so instanceof / stack work)", () => {
        const err = new AppError(400, "Bad input");
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(AppError);
        expect(err.stack).toBeDefined();
    });

    it("carries statusCode and message", () => {
        const err = new AppError(404, "Not found");
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe("Not found");
    });

    it("marks itself operational and defaults code to null", () => {
        const err = new AppError(401, "Unauthorized");
        expect(err.isOperational).toBe(true);
        expect(err.code).toBeNull();
    });

    it("stores an optional machine-readable code", () => {
        const err = new AppError(401, "Expired", "ACCESS_TOKEN_EXPIRED");
        expect(err.code).toBe("ACCESS_TOKEN_EXPIRED");
    });
});
