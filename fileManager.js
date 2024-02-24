const fs = require("fs")

const createFolder = (relPath) => {
    try {
        if (fs.existsSync(relPath)) {
            throw new Error("file exists")
        }
        else {
            fs.mkdirSync(relPath);
        }
    } catch (error) {
        return error;
    }
}
const removeFolder = (relPath) => {
    fs.rmSync(relPath, { recursive: true, force: true });
}

module.exports = { createFolder, removeFolder }