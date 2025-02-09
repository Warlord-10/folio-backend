const redColor = '\x1b[31m';
const greenColor = '\x1b[32m';
const resetColor = '\x1b[0m';
const yellowColor = "\x1b[33m"

function logInfo(log){
    if(process.env.MODE === "dev") console.log(`${greenColor}[INFO]${yellowColor}[${new Date()}]:${resetColor}`, log);
}
function logError(log){
    if(process.env.MODE === "dev") console.error(`${redColor}[ERROR]${yellowColor}[${new Date()}]:${resetColor}`, log);
}

module.exports = {logError, logInfo};