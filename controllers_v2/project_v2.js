const path = require("path");
const ProjectModel = require("../models/project.js");
const UserModel = require("../models/user.js");
const linguist = require('linguist-js');
const { logError, logInfo } = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");

const RabbitMQClient = require("../services/rabbitmq.js");

// Fetches the project by name
async function getProjectByName(req, res) {
    try {
        logInfo("getProjectByName");
        const data = await ProjectModel.findOne({ owner_id: req.params.uid, title: req.params.pname }).populate("owner_id");

        if (!data) {
            return res.status(404).json('No Project Found');
        }

        const { files, languages, unknown } = await linguist(path.join(process.cwd(), process.env.PROJECT_FILE_DEST, data.owner_id._id.toHexString(), data.title))

        return res.status(200).json({
            data: data,
            metadata: languages,
            permission: generatePermission(req.user._id, req.params.uid)
        });
    } catch (error) {
        logError(error)
        return res.status(500).json("Error occurred in fetching the project");
    }
}

// Transpiles the project
async function transpileProject_v2(req, res) {
    try {
        logInfo("transpileProject_v2");
        const project = await ProjectModel.findById(req.params.pid);
        const user = await UserModel.findById(req.user._id);

        if (!project) {
            return res.status(404).json("Project Not Found");
        }
        if (generatePermission(project.owner_id, req.user._id) != "OWNER") {
            return res.status(401).json("Permission Denied");
        }
        if (!user?.user_portfolio) {
            return res.status(500).json("No default project");
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

        // Connect to RabbitMQ 
        const rabbit = RabbitMQClient.getInstance();
        await rabbit.connect(); 
        await rabbit.sendToQueue(job);
        logInfo(`Job queued for transpilation: ${project.title}`);

        return res.status(200).json({
            message: "Project transpilation job queued successfully",
            jobId: `${job.userId}_${job.timestamp}`
        });
    } catch (error) {
        logError("Error queueing transpilation job:", error);
        return res.status(500).json("Error occurred while queueing the transpilation job");
    }
}


module.exports = {
    getProjectByName,
    transpileProject_v2
}