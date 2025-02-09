const path = require("path");
const ProjectModel = require("../models/project");
const UserModel = require("../models/user.js");
const PortfolioModel = require("../models/portfolio.js")

const webpackConfig = require('../webpack.config.js');
const webpack = require('webpack');
const logger = require("../utils/logger.js")


// Use for getting the overview of all the projects of a user
async function getUserProjects(req, res) {
    try {
        console.log("getUserProjects")
        const data = await ProjectModel.find({ owner_id: req.params.uid });

        return res.status(200).json({
            data: data,
            permission: req.user.userId == req.params.uid ? "OWNER" : "VISITOR"
        });
    } catch (error) {
        logger(error)
        return res.status(404).json(error);
    }
}

// Needs authorization and only for testing, not implemented right now
async function delAllProjects(req, res) {
    try {
        const ownerId = req.user.userId;
        await UserModel.findByIdAndUpdate(ownerId, { $set: { projects: [] } });
        const data = await ProjectModel.deleteMany({ owner: ownerId });
        return res.status(200).json({
            data
        });
    } catch (error) {
        logger(error)
        return res.status(500).json({ error: 'Error' });
    }
}




// Use for getting the detail view of a project
async function getProjectById(req, res) {
    try {
        console.log("getProjectById");
        const data = await ProjectModel.findById(req.params.pid).populate("owner_id");

        return res.status(200).json({
            data: data,
            permission: req.user.userId == data.owner_id._id ? "OWNER" : "VISITOR"
        });
    } catch (error) {
        logger(error)
        return res.status(404).json('Project Not Found');
    }
}


// for creating a project
async function createProject(req, res) {
    try {
        console.log("createProject");
        const project = await ProjectModel.create({
            owner_id: req.user.userId,
            title: req.body.title,
            description: req.body.description,
        });
        return res.status(201).json({
            data: project
        });
    } catch (error) {
        logger(error)
        return res.status(500).json({ error: 'Project creation failed' });
    }
}


async function delProjectById(req, res) {
    try {
        console.log("delProjectById");
        const projectData = await ProjectModel.findById(req.params.pid);
        if (projectData.owner_id == req.user.userId) {
            await projectData.deleteOne();
            return res.status(200).json(projectData);
        }
        return res.status(401).json('Permission Denied')

    } catch (error) {
        logger(error)
        return res.status(500).json('Error in Deletion');
    }
}
async function updateProjectById(req, res) {
    try {
        console.log("updateProjectById")
        const data = await ProjectModel.findById(req.params.pid);
        if (data.owner_id == req.user.userId) {
            const result = await ProjectModel.findByIdAndUpdate(req.params.pid, req.body, { new: true })
            return res.status(200).json(result);
        }
        return res.status(401).json('Permission Denied')

    } catch (error) {
        logger(error)
        return res.status(500).json('Error in Updating Project');
    }
}


async function transpileProject(req, res) {
    try {
        console.log("transpileProject", req.params);
        const project = await ProjectModel.findById(req.params.pid);
        const user = await UserModel.findById(req.user.userId);
        if (user.user_portfolio === "null" || user.user_portfolio === "undefined") {
            return res.status(500).json("No default project");
        }

        const inputDir = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, `${project.owner_id}`, `${project.title}`, "index.jsx");
        const outputDir = path.join(process.cwd(), process.env.BUNDLED_PROJECT_DEST, `${project.owner_id}`);

        const customWebpackConfig = webpackConfig(
            path.join(project.owner_id.toHexString(),project.title), 
            project.owner_id.toHexString()
        ) 

        webpack(customWebpackConfig, async (err, stats) => {
            console.log("webpack");
            if (err || stats.hasErrors()) {
                // Handle errors here
                console.log("error: ", stats.toJson().errors);
                console.log(err);
                logger(err)
                return res.status(500).json(err);
            }
            // Done processing
            console.log("compiled");
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
        });

    } catch (error) {
        logger(error)
        return res.status(500).json(error)
    }
}


module.exports = {
    getUserProjects,
    getProjectById,
    createProject,
    delAllProjects,
    delProjectById,
    updateProjectById,
    transpileProject,
}