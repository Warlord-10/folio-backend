const { logError } = require("./logger.js");

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);


function errorHandler(err, req, res, next) {
    const status = err.statusCode || 500;
    logError(err.stack || err);

    res.status(status).json({
        error: err.message,
        code: err.code || null
    });
}

module.exports = { asyncHandler, errorHandler };