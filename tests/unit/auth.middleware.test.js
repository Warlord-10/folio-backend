const { softAuth, hardAuth, resolveUser } = require("../../middleware/auth.js");
const { AppError } = require("../../utils/appError.js");
const { generateAccessToken } = require("../../utils/jwt.js");

const USER = { _id: "user123", email: "a@b.com" };

// Build a fake req with the given cookies.
const reqWith = (cookies = {}) => ({ cookies });

// Capture an error thrown synchronously by a middleware (Express forwards these).
function catchThrow(fn) {
    try {
        fn();
    } catch (err) {
        return err;
    }
    return null;
}

describe("resolveUser", () => {
    it("returns the user for a valid access token", () => {
        const token = generateAccessToken(USER);
        expect(resolveUser(reqWith({ accessToken: token }))).toMatchObject(USER);
    });

    it("returns null when there is no token", () => {
        expect(resolveUser(reqWith())).toBeNull();
    });

    it("returns null for a tampered/invalid token", () => {
        expect(resolveUser(reqWith({ accessToken: "garbage" }))).toBeNull();
    });
});

describe("softAuth", () => {
    it("sets req.user for a valid token and proceeds", () => {
        const req = reqWith({ accessToken: generateAccessToken(USER) });
        const next = jest.fn();

        softAuth(req, {}, next);

        expect(req.user).toMatchObject(USER);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("proceeds as guest (null user) when no token is present", () => {
        const req = reqWith();
        const next = jest.fn();

        softAuth(req, {}, next);

        expect(req.user).toBeNull();
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("proceeds as guest even with a refresh token (truly soft, never blocks)", () => {
        const req = reqWith({ refreshToken: "some-refresh" });
        const next = jest.fn();

        softAuth(req, {}, next);

        expect(req.user).toBeNull();
        expect(next).toHaveBeenCalledTimes(1);
    });
});

describe("hardAuth", () => {
    it("sets req.user and proceeds for a valid token", () => {
        const req = reqWith({ accessToken: generateAccessToken(USER) });
        const next = jest.fn();

        hardAuth(req, {}, next);

        expect(req.user).toMatchObject(USER);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("throws 401 AUTH_REQUIRED when there is no token at all", () => {
        const next = jest.fn();
        const err = catchThrow(() => hardAuth(reqWith(), {}, next));

        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe("AUTH_REQUIRED");
        expect(next).not.toHaveBeenCalled();
    });

    it("throws 401 ACCESS_TOKEN_EXPIRED when only a refresh token is present", () => {
        const err = catchThrow(() => hardAuth(reqWith({ refreshToken: "r" }), {}, jest.fn()));

        expect(err.statusCode).toBe(401);
        expect(err.code).toBe("ACCESS_TOKEN_EXPIRED");
    });

    it("treats an invalid access token + refresh token as refreshable", () => {
        const err = catchThrow(() =>
            hardAuth(reqWith({ accessToken: "garbage", refreshToken: "r" }), {}, jest.fn())
        );

        expect(err.code).toBe("ACCESS_TOKEN_EXPIRED");
    });
});
