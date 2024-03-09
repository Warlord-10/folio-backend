const fs = require("fs")

const createFolder = (relPath) => {
    try {
        if (fs.existsSync(relPath)) {
            return 0;
        }
        else {
            fs.mkdirSync(relPath, {recursive: true});
        }
    } catch (error) {
        return error;
    }
}
const removeFolder = (relPath) => {
    fs.rmSync(relPath, { recursive: true, force: true });
}
const createFile = (relPath) => {
    try {
        fs.writeFile(relPath, "", ()=>{})
    } catch (error) {
        
    }
}

module.exports = { createFolder, removeFolder }