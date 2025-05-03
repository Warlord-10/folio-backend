const path = require("path");
const ProjectModel = require("../models/project");
const UserModel = require("../models/user.js");
const PortfolioModel = require("../models/portfolio.js")

const webpackConfig = require('../webpack.config.js');
const webpack = require('webpack');
const {logError, logInfo} = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");


// Gets all the project of a user
async function getUserProjects(req, res) {
    try {
        logInfo("getUserProjects")
        const data = await ProjectModel.find({ owner_id: req.params.uid });

        if(!data) {
            return res.status(404).send('No Projects Found');
        }

        return res.status(200).json({
            data: data,
            permission: generatePermission(req.user._id, req.params.uid)
        });
    } catch (error) {
        logError(error)
        return res.status(500).json(error);
    }
}


// Use for fetching the detail view of a project
async function getProjectById(req, res) {
    try {
        logInfo("getProjectById");
        const data = await ProjectModel.findById(req.params.pid).populate("owner_id");

        if(!data) {
            return res.status(404).json('Project Not Found');
        }

        return res.status(200).json({
            data: data,
            permission: generatePermission(req.user._id, data.owner_id._id)
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

        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json('Title is required');
        }

        // If folder of same name already exist in the file system then return error
        const projectRepeated = await ProjectModel.findOne({owner_id: req.user._id, title: title });
        if (projectRepeated) {
            return res.status(400).json(`Project with ${title} already exists`);
        }

        const project = await ProjectModel.create({
            owner_id: req.user._id,
            title: title.replace(/\s+/g, '_'),
            description: description,
        });

        return res.status(201).json({
            data: project,
            permission: generatePermission(req.user._id, project.owner_id)
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
        const projectData = await ProjectModel.findById(req.params.pid);

        if (!projectData) {
            return res.status(404).json('Project Not Found');
        }
        if (generatePermission(projectData.owner_id, req.user._id) != "OWNER") {
            return res.status(401).json('Permission Denied')
        }

        await projectData.deleteOne();
        return res.status(200).json(projectData);
    } catch (error) {
        logError(error)
        return res.status(500).json('Error in Deletion');
    }
}

// updates a project
async function updateProjectById(req, res) {
    try {
        logInfo("updateProjectById")
        const data = await ProjectModel.findOne({_id: req.params.pid});

        if (!data) {
            return res.status(404).json('Project Not Found');
        }
        if (generatePermission(req.user._id, data.owner_id) != "OWNER") {
            return res.status(403).json('Permission Denied')
        }

        const result = await data.updateOne(req.body, { new: true })
        return res.status(200).json(result);
    } catch (error) {
        logError(error)
        return res.status(500).json('Error in updating the project');
    }
}


async function transpileProject(req, res) {
    try {
        logInfo("transpileProject", req.params);
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

        const customWebpackConfig = webpackConfig(
            path.join(project.owner_id.toHexString(), project.title), project.owner_id.toHexString()
        ) 


        // Convert webpack to promise-based operation
        const stats = await new Promise((resolve, reject) => {
            logInfo("Webpack transpiling started...")
            webpack(customWebpackConfig, (err, stats) => {
                if (err) reject(err);
                else resolve(stats);
            });
        });

        if (stats.hasErrors()) {
            logError(stats.toJson().errors);
            return res.status(500).json(stats.toJson().errors);
        }

        logInfo("Project transpiled successfully");
        const result = await PortfolioModel.findOneAndUpdate(
            {_id: project.owner_id},
            {$set: {
                owner_name: user.name,
                title: project.title,
                description: project.description
            }},
            {upsert: true}
        );

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