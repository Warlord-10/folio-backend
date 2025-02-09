const redColor = '\x1b[31m';
const greenColor = '\x1b[32m';
const resetColor = '\x1b[0m';
const yellowColor = "\x1b[33m"

const args = process.argv;
const isVerbose = args.slice(2).includes('verbose') || process.env.MODE == "dev";
console.log(args, isVerbose)

function logInfo(log){
    if(isVerbose) console.log(`${greenColor}[INFO]${yellowColor}[${new Date()}]:${resetColor}`, log);
}
function logError(log){
    if(isVerbose) console.error(`${redColor}[ERROR]${yellowColor}[${new Date()}]:${resetColor}`, log);
}

module.exports = {logError, logInfo};