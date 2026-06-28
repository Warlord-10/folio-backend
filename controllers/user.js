const UserModel = require("../models/user");
const { setAuthCookies } = require("../utils/authUtils.js");
const { logError, logInfo } = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");
const { cacheKeys, getCache, setCache, delCache } = require("../utils/cache.js");

// Fields a user is allowed to update on their own profile.
// Prevents mass-assignment of email/password via findByIdAndUpdate.
const UPDATABLE_USER_FIELDS = ["name", "about", "avatar_path"];

// For admin task only
async function getAllUser(req, res) {
    try {
        logInfo("getAllUser");
        const data = await UserModel.find({}, "-password");
        return res.status(200).json(
            data
        );
    } catch (error) {
        return res.status(500).json({ error: 'Error' });
    }
}
async function delAllUser(req, res) {
    try {
        const data = await UserModel.deleteMany({});
        return res.status(200).json(
            data
        );
    } catch (error) {
        return res.status(500).json({ error: 'Error' });
    }
}




// To view the details of a user by Id
async function getUserById(req, res) {
    try {
        logInfo("getUserById");
        const userId = req.user?._id || null;
        const key = cacheKeys.user(req.params.uid);

        // Try cache first (public profile data only; permission is computed per-request)
        let userData = await getCache(key);

        if (!userData) {
            const data = await UserModel.findById(req.params.uid, "-password").lean();
            if (!data) {
                return res.status(404).json("User not found");
            }
            userData = data;
            await setCache(key, userData, 300); // 5 minutes
        }

        return res.status(200).json({
            data: userData,
            permission: generatePermission(userId, req.params.uid)
        });
    } catch (error) {
        logError(error)
        return res.status(500).json("Error occured in reading the user details");
    }
}

// To delete a user by Id
async function delUserById(req, res) {
    try {
        logInfo("delUserById");
        const userId = req.user?._id || null;

        // Check authorization
        if (generatePermission(userId, req.params.uid) != "OWNER") {
            return res.status(401).json("Permission Denied");
        }

        // Get the user from the DB
        const data = await UserModel.findById(req.params.uid);
        if (!data) {
            return res.status(404).json("User not found");
        }

        // Delete the user
        await data.deleteOne();

        // Invalidate caches tied to this user
        await delCache([cacheKeys.user(req.params.uid), cacheKeys.userProjects(req.params.uid)]);

        // Remove cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.status(200).send("User Deleted");
    } catch (error) {
        logError(error);
        return res.status(500).json("Error occured in deleting the user");
    }
}

// To update a user by Id
async function updateUserById(req, res) {
    try {
        logInfo("updateUserById");
        const userId = req.user?._id || null;

        // Check authorization
        if (generatePermission(userId, req.params.uid) != "OWNER") {
            return res.status(403).json("Permission Denied");
        }
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json("Body is missing");
        }

        // Whitelist updatable fields to prevent mass-assignment (email/password tampering)
        const updates = {};
        for (const field of UPDATABLE_USER_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json("No updatable fields provided");
        }

        // Update the user
        const data = await UserModel.findByIdAndUpdate(req.params.uid, updates, { new: true })
            .select("-password")
            .lean();
        if (!data) {
            return res.status(404).json("User not found");
        }

        // Refresh cache with the new data
        await setCache(cacheKeys.user(req.params.uid), data, 300);

        // set new cookies
        setAuthCookies(res, data);

        return res.status(200).json(data)
    } catch (error) {
        logError(error);
        return res.status(500).json("Error occured in updating the user");
    }
}


// Search for a user
async function findUser(req, res) {
    try {
        logInfo("findUser");
        if (!req.query.name) {
            return res.status(400).json("Name is missing");
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
    } catch (error) {
        logError(error);
        return res.status(500).json("Error occured in searching the users");
    }
}

module.exports = {
    getAllUser,
    delAllUser,

    getUserById,
    delUserById,
    updateUserById,

    findUser,
}
