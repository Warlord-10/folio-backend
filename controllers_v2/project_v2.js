const path = require("path");
const ProjectModel = require("../models/project.js");
const UserModel = require("../models/user.js");
const linguist = require('linguist-js');
const { logError, logInfo } = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");
const { cacheKeys, getCache, setCache } = require("../utils/cache.js");
const { AppError } = require("../utils/appError.js");
const { asyncHandler } = require("../utils/errorUtils.js");

const rabbitMQService = require("../services/rabbitmq.js");

// Fetches the project by name
const getProjectByName = asyncHandler(async (req, res) => {
    logInfo("getProjectByName");
    const userId = req.user?._id || null;
    const { uid, pname } = req.params;

    // Project document (cached, public)
    let data = await getCache(cacheKeys.projectByName(uid, pname));
    if (!data) {
        data = await ProjectModel.findOne({ owner_id: uid, title: pname }).populate("owner_id").lean();
        if (!data) {
            throw new AppError(404, "No Project Found");
        }
        await setCache(cacheKeys.projectByName(uid, pname), data, 120);
    }

    // Language breakdown is an expensive filesystem walk — cache it separately,
    // invalidated whenever the project's files change.
    let languages = await getCache(cacheKeys.projectLanguages(uid, pname));
    if (!languages) {
        const ownerId = (data.owner_id?._id || data.owner_id).toString();
        const result = await linguist(
            path.join(process.cwd(), process.env.PROJECT_FILE_DEST, ownerId, data.title)
        );
        languages = result.languages;
        await setCache(cacheKeys.projectLanguages(uid, pname), languages, 600); // 10 minutes
    }

    return res.status(200).json({
        data: data,
        metadata: languages,
        permission: generatePermission(userId, uid)
    });
});


// Transpiles the project
const transpileProject_v2 = asyncHandler(async (req, res) => {
    logInfo("transpileProject_v2");
    const userId = req.user?._id || null;

    // Check if the user has permission to transpile the project
    const project = await ProjectModel.findById(req.params.pid);
    if (!project) {
        throw new AppError(404, "Project Not Found");
    }
    if (generatePermission(userId, project.owner_id) != "OWNER") {
        throw new AppError(401, "Permission Denied");
    }

    // Check if the user has set this project as the portfolio
    const user = await UserModel.findById(userId);
    if (!user?.user_portfolio) {
        throw new AppError(400, "No default project");
    }

    // configs for transpiling the project
    const inputDir = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, `${project.owner_id}`, `${project.title}`, "index.jsx");
    const outputDir = path.join(process.cwd(), process.env.BUNDLED_PROJECT_DEST, `${project.owner_id}`);

    // Create a job object with all necessary information
    const job = {
        projectId: project._id.toHexString(),
        userId: project.owner_id.toHexString(),
        projectTitle: project.title,
        inputPath: inputDir,
        outputPath: outputDir,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    // Send to RabbitMQ
    await rabbitMQService.sendToQueue('transpile_jobs', job);
    logInfo(`Job queued for transpilation: ${project.title}`);

    return res.status(200).json({
        message: "Project transpilation job queued successfully",
        jobId: `${job.userId}_${job.timestamp}`
    });
});


module.exports = {
    getProjectByName,
    transpileProject_v2
}
