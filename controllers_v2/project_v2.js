const path = require("path");
const ProjectModel = require("../models/project.js");
const UserModel = require("../models/user.js");
const linguist = require('linguist-js');
const {logError, logInfo} = require("../utils/logger.js");
const { generatePermission } = require("../utils/permissionManager.js");


// Fetches the project by name
async function getProjectByName(req, res){
    try {
        logInfo("getProjectByName");
        const data = await ProjectModel.findOne({owner_id: req.params.uid, title: req.params.pname}).populate("owner_id");

        if(!data){
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


module.exports = {
    getProjectByName
}