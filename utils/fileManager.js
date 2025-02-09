const fs = require("fs")

const createFolder = (absPath) => {
    try {
        if (fs.existsSync(absPath)) {
            return 0;
        }
        else {
            fs.mkdirSync(absPath, {recursive: true});
        }
    } catch (error) {
        return error;
    }
}

const removeFolder = (relPath) => {
    fs.rmSync(relPath, { recursive: true, force: true });
}

const createFile = (relPath) => {
    fs.writeFile(relPath, "", (err)=>{
        if(err) return err
    });
}

module.exports = { createFolder, removeFolder, createFile }