const path = require("path");
const ProjectModel = require("../models/project.js");
const UserModel = require("../models/user.js");
const linguist = require('linguist-js');
const logger = require("../utils/logger.js")



async function getProjectByName(req, res){
    try {
        console.log("getProjectByName");
        const data = await ProjectModel.findOne({owner_id: req.params.uid, title: req.params.pname}).populate("owner_id");
        const { files, languages, unknown } = await linguist(path.join(process.cwd(), process.env.PROJECT_FILE_DEST, data.owner_id._id.toHexString(), data.title))
        return res.status(200).json({
            data: data,
            metadata: languages,
            permission: req.user.userId == req.params.uid ? "OWNER" : "VISITOR"
        });
    } catch (error) {
        logger(error)
        return res.status(404).json('Project Not Found');
    }
}


module.exports = {
    getProjectByName
}