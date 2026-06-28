// Unit-test the cache helper against a controlled fake Redis client.
// (Variables referenced inside a jest.mock factory must be prefixed with "mock".)
const mockClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scanIterator: jest.fn(),
};

jest.mock("../../services/redis.js", () => ({
    redisService: { getClient: jest.fn(() => mockClient) },
}));

const { cacheKeys, getCache, setCache, delCache, wrap } = require("../../utils/cache.js");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("cacheKeys", () => {
    it("builds stable, namespaced keys", () => {
        expect(cacheKeys.user("u1")).toBe("user:u1");
        expect(cacheKeys.userProjects("u1")).toBe("projects:user:u1");
        expect(cacheKeys.portfolioPage(2, 10)).toBe("portfolio:page:2:10");
    });
});

describe("getCache", () => {
    it("returns the parsed value on a hit", async () => {
        mockClient.get.mockResolvedValue(JSON.stringify({ a: 1 }));
        await expect(getCache("k")).resolves.toEqual({ a: 1 });
    });

    it("returns null on a miss", async () => {
        mockClient.get.mockResolvedValue(null);
        await expect(getCache("k")).resolves.toBeNull();
    });
});

describe("setCache", () => {
    it("writes JSON with a TTL", async () => {
        await setCache("k", { a: 1 }, 120);
        expect(mockClient.set).toHaveBeenCalledWith("k", JSON.stringify({ a: 1 }), { EX: 120 });
    });
});

describe("wrap (cache-aside)", () => {
    it("runs the loader and caches the result on a miss", async () => {
        mockClient.get.mockResolvedValue(null);
        const loader = jest.fn().mockResolvedValue({ fresh: true });

        const result = await wrap("k", 60, loader);

        expect(result).toEqual({ fresh: true });
        expect(loader).toHaveBeenCalledTimes(1);
        expect(mockClient.set).toHaveBeenCalled();
    });

    it("returns the cached value and skips the loader on a hit", async () => {
        mockClient.get.mockResolvedValue(JSON.stringify({ cached: true }));
        const loader = jest.fn();

        const result = await wrap("k", 60, loader);

        expect(result).toEqual({ cached: true });
        expect(loader).not.toHaveBeenCalled();
    });
});

describe("fail-open behaviour", () => {
    it("returns null (does not throw) when Redis is unavailable", async () => {
        const { redisService } = require("../../services/redis.js");
        redisService.getClient.mockImplementationOnce(() => { throw new Error("down"); });

        await expect(getCache("k")).resolves.toBeNull();
    });
});
