const path = require("path");
const ProjectModel = require("../models/project");
const UserModel = require("../models/user.js");
const { exec, execSync } = require('child_process');



// Use for getting the overview of all the projects of a user
async function getUserAllProjects(req, res){
    try {
        console.log("getUserAllProjects")
        const data = await ProjectModel.find({owner: req.params.uid});
        
        return res.status(200).json({
            data
        });
    } catch (error) {
        return res.status(404).json({ error: 'Error' });
    }
    
}
// Use for getting the detail view of a project
async function getProjectById(req, res){
    try {
        console.log("getProjectById");
        const data = await ProjectModel.findById(req.params.pid);
        return res.status(200).json(
            data
        );
    } catch (error) {
        return res.status(404).json({ error: 'Project Not Found' });
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
        return res.status(200).json({
            msg:"created",
            pid: project
        });
    } catch (error) {
        return res.status(500).json({ error: 'Project creation failed' });
    }
}



// Needs authorization
async function delAllProjects(req, res){
    try {
        const ownerId = req.params.uid;
        await UserModel.findByIdAndUpdate(ownerId, {$set: {projects:[]}});
        const data = await ProjectModel.deleteMany({owner: ownerId});
        return res.status(200).json({
            data
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error' });
    }
}

async function delProjectById(req, res){
    try {
        console.log("delProjectById")
        const data = await ProjectModel.findById(req.params.pid);
        await data.deleteOne();
        return res.status(200).json(
            data
        );
    } catch (error) {
        return res.status(500).json({ error: 'Error in Deletion' });
    }
}
async function updateProjectById(req, res){
    try {
        console.log("updateProjectById")
        req.body.banner = `http://127.0.0.1:3005/public/${req.user.userId}/${req.file.filename}`
        const data = await ProjectModel.findByIdAndUpdate(req.params.pid, req.body, {new: true});
        return res.status(200).json(
            data
        );
    } catch (error) {
        return res.status(500).json({ error: 'Error in Updation' });
    }
}


async function transpileProject(req, res){
    try {
        console.log("transpileProject");
        const data = await ProjectModel.findById(req.params.pid);

        const inputDir = path.resolve(__dirname, ".." ,'db_files',`${data.owner}`, `${data._id}`, "index.jsx");
        const outputDir = path.resolve(__dirname, "..", 'bundles', `${data.owner}`);

        const command2 = `webpack --config webpack.config.js --entry ${inputDir} --output-path ${outputDir}`;

        execSync(command2)
        
        return res.status(200).json({"msg": "compiled"});

    } catch (error) {
        return res.status(500).json({error: error})
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