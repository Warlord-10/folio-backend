const {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} = require("../../utils/jwt.js");

describe("jwt access tokens", () => {
    it("round-trips the payload (sign then verify)", () => {
        const payload = { _id: "abc", email: "a@b.com" };
        const token = generateAccessToken(payload);
        const decoded = verifyAccessToken(token);

        // generateAccessToken signs { user: data }
        expect(decoded.user).toMatchObject(payload);
    });

    it("rejects a tampered/invalid token", () => {
        expect(() => verifyAccessToken("not.a.real.token")).toThrow();
    });
});

describe("jwt refresh tokens", () => {
    it("round-trips the payload and returns the user directly", () => {
        const payload = { _id: "abc", email: "a@b.com" };
        const token = generateRefreshToken(payload);
        const decoded = verifyRefreshToken(token);

        expect(decoded).toMatchObject(payload);
    });

    it("does not accept an access token as a refresh token (separate secrets)", () => {
        const accessToken = generateAccessToken({ _id: "abc" });
        expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
});
