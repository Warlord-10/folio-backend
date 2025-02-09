function logError(log){
    if(process.env.MODE === "dev") console.log("Logger Error: ",log);
}

module.exports = logError;