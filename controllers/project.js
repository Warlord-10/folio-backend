const ProjectModel = require("../models/project");

const { logError, logInfo } = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");
const { cacheKeys, getCache, setCache, delCache } = require("../utils/cache.js");

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
async function getUserProjects(req, res) {
    try {
        logInfo("getUserProjects")
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
    } catch (error) {
        logError(error)
        return res.status(500).json(error);
    }
}


// Use for fetching the detailed view of a project
async function getProjectById(req, res) {
    try {
        logInfo("getProjectById");
        const UserId = req.user?._id || null;
        const key = cacheKeys.project(req.params.pid);

        let data = await getCache(key);
        if (!data) {
            data = await ProjectModel.findById(req.params.pid).populate("owner_id").lean();
            if (!data) {
                return res.status(404).json('Project Not Found');
            }
            await setCache(key, data, 120); // 2 minutes
        }

        const ownerId = data.owner_id?._id || data.owner_id;
        return res.status(200).json({
            data: data,
            permission: generatePermission(UserId, ownerId)
        });
    } catch (error) {
        logError(error)
        return res.status(500).json('Project Not Found');
    }
}


// for creating a project
async function createProject(req, res) {
    try {
        logInfo("createProject");
        const UserId = req.user?._id || null;
        if (!UserId) {
            return res.status(401).json('Unauthorized');
        }

        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json('Title is required');
        }

        // If folder of same name already exist in the file system then return error
        const projectRepeated = await ProjectModel.findOne({ owner_id: req.user._id, title: title });
        if (projectRepeated) {
            return res.status(400).json(`Project with ${title} already exists`);
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
    } catch (error) {
        logError(error)
        return res.status(500).json('Project creation failed');
    }
}

// for deleting a project
async function delProjectById(req, res) {
    try {
        logInfo("delProjectById");
        const UserId = req.user?._id || null;
        if (!UserId) {
            return res.status(401).json('Unauthorized');
        }

        const projectData = await ProjectModel.findById(req.params.pid);
        if (!projectData) {
            return res.status(404).json('Project Not Found');
        }
        if (generatePermission(UserId, projectData.owner_id) != "OWNER") {
            return res.status(401).json('Permission Denied')
        }

        await projectData.deleteOne();
        await invalidateProjectCaches(projectData);

        return res.status(200).json(projectData);
    } catch (error) {
        logError(error)
        return res.status(500).json('Error in Deletion');
    }
}

// updates a project
async function updateProjectById(req, res) {
    try {
        logInfo("updateProjectById", req.body)
        const UserId = req.user?._id || null;
        if (!UserId) {
            return res.status(401).json('Unauthorized');
        }

        const data = await ProjectModel.findOne({ _id: req.params.pid });
        if (!data) {
            return res.status(404).json('Project Not Found');
        }
        if (generatePermission(UserId, data.owner_id) != "OWNER") {
            return res.status(403).json('Permission Denied')
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
    } catch (error) {
        logError(error)
        return res.status(500).json('Error in updating the project');
    }
}


async function transpileProject(req, res) {
    try {
        return res.status(200).json("compiled");
    } catch (error) {
        logError(error)
        return res.status(500).json(error)
    }
}


module.exports = {
    getUserProjects,
    getProjectById,
    createProject,
    delProjectById,
    updateProjectById,
    transpileProject,
}
