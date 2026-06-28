const UserModel = require("../models/user");
const { setAuthCookies } = require("../utils/authUtils.js");
const { logError, logInfo } = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");
const { cacheKeys, getCache, setCache, delCache } = require("../utils/cache.js");
const { AppError } = require("../utils/appError.js");
const { asyncHandler } = require("../utils/errorUtils.js");

// Fields a user is allowed to update on their own profile.
// Prevents mass-assignment of email/password via findByIdAndUpdate.
const UPDATABLE_USER_FIELDS = ["name", "about", "avatar_path"];

// For admin task only
const getAllUser = asyncHandler(async (req, res) => {
    logInfo("getAllUser");
    const data = await UserModel.find({}, "-password");
    return res.status(200).json(data);
});

const delAllUser = asyncHandler(async (req, res) => {
    const data = await UserModel.deleteMany({});
    return res.status(200).json(data);
});




// To view the details of a user by Id
const getUserById = asyncHandler(async (req, res) => {
    logInfo("getUserById");
    const userId = req.user?._id || null;
    const key = cacheKeys.user(req.params.uid);

    // Try cache first (public profile data only; permission is computed per-request)
    let userData = await getCache(key);

    if (!userData) {
        const data = await UserModel.findById(req.params.uid, "-password").lean();
        if (!data) {
            throw new AppError(404, "User not found");
        }
        userData = data;
        await setCache(key, userData, 300); // 5 minutes
    }

    return res.status(200).json({
        data: userData,
        permission: generatePermission(userId, req.params.uid)
    });
});

// To delete a user by Id
const delUserById = asyncHandler(async (req, res) => {
    logInfo("delUserById");
    const userId = req.user?._id || null;

    // Check authorization
    if (generatePermission(userId, req.params.uid) != "OWNER") {
        throw new AppError(401, "Permission Denied");
    }

    // Get the user from the DB
    const data = await UserModel.findById(req.params.uid);
    if (!data) {
        throw new AppError(404, "User not found");
    }

    // Delete the user
    await data.deleteOne();

    // Invalidate caches tied to this user
    await delCache([cacheKeys.user(req.params.uid), cacheKeys.userProjects(req.params.uid)]);

    // Remove cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).send("User Deleted");
});

// To update a user by Id
const updateUserById = asyncHandler(async (req, res) => {
    logInfo("updateUserById");
    const userId = req.user?._id || null;

    // Check authorization
    if (generatePermission(userId, req.params.uid) != "OWNER") {
        throw new AppError(403, "Permission Denied");
    }
    if (!req.body || Object.keys(req.body).length === 0) {
        throw new AppError(400, "Body is missing");
    }

    // Whitelist updatable fields to prevent mass-assignment (email/password tampering)
    const updates = {};
    for (const field of UPDATABLE_USER_FIELDS) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (Object.keys(updates).length === 0) {
        throw new AppError(400, "No updatable fields provided");
    }

    // Update the user
    const data = await UserModel.findByIdAndUpdate(req.params.uid, updates, { new: true })
        .select("-password")
        .lean();
    if (!data) {
        throw new AppError(404, "User not found");
    }

    // Refresh cache with the new data
    await setCache(cacheKeys.user(req.params.uid), data, 300);

    // set new cookies
    setAuthCookies(res, data);

    return res.status(200).json(data);
});


// Search for a user
const findUser = asyncHandler(async (req, res) => {
    logInfo("findUser");
    if (!req.query.name) {
        throw new AppError(400, "Name is missing");
    }

    // Anchor the regex to the start so a MongoDB index on `name` can be used.
    const searchTerm = req.query.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp("^" + searchTerm, "i");
    const data = await UserModel
        .find({ name: { $regex: regex } })
        .limit(10)
        .select("name _id")
        .lean()
        .exec();

    return res.status(200).json(data || []);
});

module.exports = {
    getAllUser,
    delAllUser,

    getUserById,
    delUserById,
    updateUserById,

    findUser,
}
