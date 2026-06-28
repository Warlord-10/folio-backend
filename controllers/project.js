const ProjectModel = require("../models/project");

const { logError, logInfo } = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");
const { cacheKeys, getCache, setCache, delCache } = require("../utils/cache.js");
const { AppError } = require("../utils/appError.js");
const { asyncHandler } = require("../utils/errorUtils.js");

// Updatable project fields (prevents mass-assignment via req.body).
const UPDATABLE_PROJECT_FIELDS = ["title", "description", "banner_path", "metadata"];

// Invalidates every cache entry touched by a project mutation.
async function invalidateProjectCaches(project) {
    const ownerId = (project.owner_id?._id || project.owner_id)?.toString();
    await delCache([
        cacheKeys.project(project._id.toString()),
        cacheKeys.userProjects(ownerId),
        cacheKeys.projectByName(ownerId, project.title),
        cacheKeys.projectLanguages(ownerId, project.title),
    ]);
}


// Gets all the projects of a user
const getUserProjects = asyncHandler(async (req, res) => {
    logInfo("getUserProjects");
    const UserId = req.user?._id || null;
    const key = cacheKeys.userProjects(req.params.uid);

    // Cache the public project list; permission is layered per-request.
    let data = await getCache(key);
    if (!data) {
        data = await ProjectModel.find({ owner_id: req.params.uid }).lean();
        await setCache(key, data, 120); // 2 minutes
    }

    return res.status(200).json({
        data: data,
        permission: generatePermission(UserId, req.params.uid)
    });
});


// Use for fetching the detailed view of a project
const getProjectById = asyncHandler(async (req, res) => {
    logInfo("getProjectById");
    const UserId = req.user?._id || null;
    const key = cacheKeys.project(req.params.pid);

    let data = await getCache(key);
    if (!data) {
        data = await ProjectModel.findById(req.params.pid).populate("owner_id").lean();
        if (!data) {
            throw new AppError(404, "Project Not Found");
        }
        await setCache(key, data, 120); // 2 minutes
    }

    const ownerId = data.owner_id?._id || data.owner_id;
    return res.status(200).json({
        data: data,
        permission: generatePermission(UserId, ownerId)
    });
});


// for creating a project
const createProject = asyncHandler(async (req, res) => {
    logInfo("createProject");
    const UserId = req.user?._id || null;
    if (!UserId) {
        throw new AppError(401, "Unauthorized");
    }

    const { title, description } = req.body;
    if (!title) {
        throw new AppError(400, "Title is required");
    }

    // If folder of same name already exist in the file system then return error
    const projectRepeated = await ProjectModel.findOne({ owner_id: req.user._id, title: title });
    if (projectRepeated) {
        throw new AppError(400, `Project with ${title} already exists`);
    }

    const project = await ProjectModel.create({
        owner_id: req.user._id,
        title: title.replace(/\s+/g, '_'),
        description: description,
    });

    // New project invalidates the owner's project list cache
    await delCache(cacheKeys.userProjects(UserId.toString()));

    return res.status(201).json({
        data: project,
        permission: generatePermission(UserId, project.owner_id)
    });
});

// for deleting a project
const delProjectById = asyncHandler(async (req, res) => {
    logInfo("delProjectById");
    const UserId = req.user?._id || null;
    if (!UserId) {
        throw new AppError(401, "Unauthorized");
    }

    const projectData = await ProjectModel.findById(req.params.pid);
    if (!projectData) {
        throw new AppError(404, "Project Not Found");
    }
    if (generatePermission(UserId, projectData.owner_id) != "OWNER") {
        throw new AppError(401, "Permission Denied");
    }

    await projectData.deleteOne();
    await invalidateProjectCaches(projectData);

    return res.status(200).json(projectData);
});

// updates a project
const updateProjectById = asyncHandler(async (req, res) => {
    logInfo("updateProjectById", req.body);
    const UserId = req.user?._id || null;
    if (!UserId) {
        throw new AppError(401, "Unauthorized");
    }

    const data = await ProjectModel.findOne({ _id: req.params.pid });
    if (!data) {
        throw new AppError(404, "Project Not Found");
    }
    if (generatePermission(UserId, data.owner_id) != "OWNER") {
        throw new AppError(403, "Permission Denied");
    }

    // Whitelist updatable fields to prevent mass-assignment
    const updates = {};
    for (const field of UPDATABLE_PROJECT_FIELDS) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const result = await ProjectModel.findByIdAndUpdate(req.params.pid, updates, { new: true });
    await invalidateProjectCaches(data); // old title/owner
    await invalidateProjectCaches(result); // new title/owner

    return res.status(200).json(result);
});


const transpileProject = asyncHandler(async (req, res) => {
    return res.status(200).json("compiled");
});


module.exports = {
    getUserProjects,
    getProjectById,
    createProject,
    delProjectById,
    updateProjectById,
    transpileProject,
}
