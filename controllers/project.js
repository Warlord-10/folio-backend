const path = require("path");
const ProjectModel = require("../models/project");
const UserModel = require("../models/user.js");
const webpackConfig = require('../webpack.config.js');
const webpack = require('webpack');


// Use for getting the overview of all the projects of a user
async function getUserAllProjects(req, res){
    try {
        console.log("getUserAllProjects")
        const data = await ProjectModel.find({owner: req.user.userId});
        
        return res.status(200).json({
            data
        });
    } catch (error) {
        return res.status(404).json(error);
    }
}

// Needs authorization
async function delAllProjects(req, res){
    try {
        const ownerId = req.user.userId;
        await UserModel.findByIdAndUpdate(ownerId, {$set: {projects:[]}});
        const data = await ProjectModel.deleteMany({owner: ownerId});
        return res.status(200).json({
            data
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error' });
    }
}




// Use for getting the detail view of a project
async function getProjectById(req, res){
    try {
        console.log("getProjectById");
        const data = await ProjectModel.findById(req.params.pid);
        if(req.user && req.user.userId == data.owner){
            return res.status(200).json({data, PERMISSION:"OWNER"});
        }
        return res.status(200).json({data, PERMISSION:"VISITOR"});
    } catch (error) {
        return res.status(404).json('Project Not Found');
    }
}


// for creating a project
async function createProject(req, res){
    try {
        console.log("createProject");
        const project = await ProjectModel.create({
            owner: req.user.userId,
            title: req.body.title,
            description: req.body.description,
        });
        return res.status(201).json({
            msg:"created",
            pid: project
        });
    } catch (error) {
        return res.status(500).json({ error: 'Project creation failed' });
    }
}


async function delProjectById(req, res){
    try {
        console.log("delProjectById")
        const data = await ProjectModel.findById(req.params.pid);
        if(data.owner == req.user.userId){
            await data.deleteOne();
            return res.status(200).json(data);
        }
        return res.status(401).json('Permission Denied')
    } catch (error) {
        return res.status(500).json('Error in Deletion' );
    }
}
async function updateProjectById(req, res){
    try {
        console.log("updateProjectById")
        const data = await ProjectModel.findById(req.params.pid);
        if(data.owner == req.user.userId){
            const result = await ProjectModel.findByIdAndUpdate(req.params.pid, req.body, {new: true})
            return res.status(200).json(result);
        }
        return res.status(401).json('Permission Denied')
    } catch (error) {
        return res.status(500).json('Error in Updation' );
    }
}


async function transpileProject(req, res){
    try {
        console.log("transpileProject");
        const user = await UserModel.findById(req.user.userId);
        if(user.userPageProject === "null" || user.userPageProject === "undefined"){
            return res.status(500).json("No default project");
        }

        const inputDir = path.resolve(__dirname, ".." ,'db_files',`${user._id}`, `${user.userPageProject}`, "index.jsx");
        const outputDir = path.resolve(__dirname, "..", 'bundles', `${user._id}`);

        
        webpackConfig.entry = inputDir;
        webpackConfig.output.path = outputDir;
        webpack(webpackConfig, (err, stats) => { 
            if (err || stats.hasErrors()) {
                // Handle errors here
                console.error(err);
                return res.status(500).json("Error in webpack");
            }
            // Done processing
            console.log("compiled");
            return res.status(200).json("compiled");
        });

    } catch (error) {
        return res.status(500).json(error)
    }
}


module.exports = {
    getUserAllProjects,
    getProjectById,
    createProject,
    delAllProjects,
    delProjectById,
    updateProjectById,
    transpileProject,
}