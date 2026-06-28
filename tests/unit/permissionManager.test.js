const { generatePermission } = require("../../utils/permissionManager.js");

describe("generatePermission", () => {
    it("returns OWNER when the user is the resource owner", () => {
        expect(generatePermission("user123", "user123")).toBe("OWNER");
    });

    it("returns VISITOR for a different user", () => {
        expect(generatePermission("user123", "user456")).toBe("VISITOR");
    });

    it("returns VISITOR for a guest (null user)", () => {
        expect(generatePermission(null, "user123")).toBe("VISITOR");
    });
});
