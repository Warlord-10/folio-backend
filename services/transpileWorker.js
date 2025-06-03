const { parentPort, workerData } = require('worker_threads');
const { getWebpackConfig } = require("../config/webpack.js")
const { logError, logInfo } = require("../utils/logger.js");

const webpack = require('webpack');
const path = require('path');
const pubSubService = require("./pubSubService")


// Process the job data received from the main thread
async function main() {
  try {
    await pubSubService.connect();
    const { projectId, projectTitle, userId, inputPath, outputPath } = workerData;

    logInfo(`Starting transpilation for project: ${projectTitle}`);

    const customWebpackConfig = getWebpackConfig(
      entry = path.join(userId, projectTitle),
      output = userId,
      progressStreamCallback = async (data) => {
        console.log("PUBLISHING DATA", data)
        await pubSubService.publish(`portfolio-logs:${projectId}`, data)
      }
    );

    webpack(customWebpackConfig, (err, stats) => {
      if (err) {
        logError(err);
        parentPort.postMessage({
          success: false,
          error: err.message
        });
        return;
      }

      const full_stats = stats.toString({
        colors: true
      });
      logInfo(`Transpilation completed for project: ${projectTitle}`);
      logInfo(`Transpilation completed for project: ${full_stats}`);

      // Send the transformed code back to main thread
      parentPort.postMessage({
        success: true,
        stats: {
          errors: full_stats.errors,
          warnings: full_stats.warnings
        }
      });
    });
  } catch (error) {
    logError(`Worker error: ${error.message}`);
    parentPort.postMessage({
      success: false,
      error: error.message
    });
  }
}

main();
