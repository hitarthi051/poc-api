"use strict";

// Import necessary modules from AWS SDK v3
const {
  LambdaClient,
  CreateAliasCommand,
  UpdateAliasCommand,
  GetAliasCommand,
  ListVersionsByFunctionCommand,
} = require("@aws-sdk/client-lambda");

class ServerlessLambdaAliasPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider("aws"); // Get the AWS provider instance

    // Define the hooks that our plugin will use
    // We want to run our logic after the deployment is complete
    this.hooks = {
      "after:deploy:deploy": this.manageGreenBlueAliases.bind(this), // Renamed hook to reflect new focus
    };

    // Initialize AWS SDK v3 Lambda client with the region from the Serverless configuration
    this.lambda = new LambdaClient({
      region: this.provider.getRegion(),
    });

    // Removed the schema definition for custom 'alias' property, as it's no longer needed.
    // The plugin will now automatically manage 'green' and 'blue' aliases.
  }

  /**
   * Helper function to create or update an alias.
   * @param {string} functionName - The full name of the Lambda function.
   * @param {string} aliasName - The name of the alias to manage (e.g., 'green').
   * @param {string} functionVersion - The Lambda version the alias should point to.
   * @param {string} description - The description for the alias.
   * @returns {Promise<void>}
   */
  async manageSingleAlias(
    functionName,
    aliasName,
    functionVersion,
    description
  ) {
    try {
      // Check if alias exists
      await this.lambda.send(
        new GetAliasCommand({
          FunctionName: functionName,
          Name: aliasName,
        })
      );
      // Alias exists, update it
      this.serverless.cli.log(
        `Updating alias "${aliasName}" for "${functionName}" to version "${functionVersion}"...`
      );
      await this.lambda.send(
        new UpdateAliasCommand({
          FunctionName: functionName,
          Name: aliasName,
          FunctionVersion: functionVersion,
          Description: description,
        })
      );
      this.serverless.cli.log(
        `Successfully updated alias "${aliasName}" for "${functionName}".`
      );
    } catch (error) {
      // Corrected error check: Check for both 'NotFoundException' and 'ResourceNotFoundException'
      if (
        error.name === "NotFoundException" ||
        error.name === "ResourceNotFoundException"
      ) {
        // Alias does not exist, create it
        this.serverless.cli.log(
          `Creating alias "${aliasName}" for "${functionName}" pointing to version "${functionVersion}"...`
        );
        await this.lambda.send(
          new CreateAliasCommand({
            FunctionName: functionName,
            Name: aliasName,
            FunctionVersion: functionVersion,
            Description: description,
          })
        );
        this.serverless.cli.log(
          `Successfully created alias "${aliasName}" for "${functionName}".`
        );
      } else {
        // Log the full error object for debugging
        this.serverless.cli.log(
          `[ERROR] Raw error in manageSingleAlias for alias "${aliasName}" on function "${functionName}":`,
          "ServerlessLambdaAliasPlugin",
          { color: "red" }
        );
        console.error(error); // Use console.error to print the full stack trace and object
        throw new this.serverless.classes.Error(
          `AWS API Error managing alias "${aliasName}" for function "${functionName}": ${
            error.message || "Unknown error"
          }. ` +
            `Error Name: ${error.name}, Error Code: ${error.Code || "N/A"}. ` +
            `Please check your AWS permissions and ensure the Lambda function exists and its name is correct.`
        );
      }
    }
  }

  /**
   * Main function to manage 'green' and 'blue' Lambda aliases.
   * This is triggered by the 'after:deploy:deploy' hook.
   */
  async manageGreenBlueAliases() {
    this.serverless.cli.log("Starting Green/Blue Lambda alias management...");

    const service = this.serverless.service;
    const functions = service.functions;
    const serviceName = service.service;
    const stage = this.provider.getStage(); // Get the current stage (e.g., dev, prod)

    // Iterate over all functions defined in serverless.yml
    for (const functionName in functions) {
      if (functions.hasOwnProperty(functionName)) {
        // Construct the full Lambda function name as deployed by Serverless
        const deployedFunctionName = `${serviceName}-${stage}-${functionName}`;

        this.serverless.cli.log(
          `Processing Green/Blue aliases for function: ${deployedFunctionName}`
        );
        // ADDED DEBUG LOGGING
        this.serverless.cli.log(
          `[DEBUG] Constructed Lambda Function Name: "${deployedFunctionName}"`,
          "ServerlessLambdaAliasPlugin",
          { color: "blue" }
        );

        try {
          // Fetch all numerical versions of the Lambda function
          const listVersionsResponse = await this.lambda.send(
            new ListVersionsByFunctionCommand({
              FunctionName: deployedFunctionName,
            })
          );

          const numericalVersions = listVersionsResponse.Versions.filter(
            (v) => v.Version !== "$LATEST"
          ) // Exclude $LATEST
            .map((v) => parseInt(v.Version, 10))
            .sort((a, b) => b - a); // Sort in descending order to get latest first

          if (numericalVersions.length === 0) {
            this.serverless.cli.log(
              `[WARNING] No numerical versions found for function "${deployedFunctionName}". ` +
                `Skipping Green/Blue alias management for this function. A new version must be published.`,
              "ServerlessLambdaAliasPlugin",
              { color: "yellow" }
            );
            continue; // Skip to the next function
          }

          const greenVersion = String(numericalVersions[0]); // Latest version
          const greenAliasName = "green"; // Static green alias name
          const greenDescription = `Green alias for ${functionName} (newly deployed version) in ${stage} stage`;

          // Manage the 'green' alias
          await this.manageSingleAlias(
            deployedFunctionName,
            greenAliasName,
            greenVersion,
            greenDescription
          );

          // --- Manage Blue Alias (if a previous version exists) ---
          if (numericalVersions.length > 1) {
            const blueVersion = String(numericalVersions[1]); // Second latest version
            const blueAliasName = "blue"; // Static blue alias name
            const blueDescription = `Blue alias for ${functionName} (previous deployed version) in ${stage} stage`;

            // Only update blue if it's not pointing to the same version as green
            if (blueVersion !== greenVersion) {
              await this.manageSingleAlias(
                deployedFunctionName,
                blueAliasName,
                blueVersion,
                blueDescription
              );
            } else {
              this.serverless.cli.log(
                `Blue alias "${blueAliasName}" not created/updated as current version is same as green (${greenVersion}).`
              );
            }
          } else {
            this.serverless.cli.log(
              `Only one numerical version found for "${deployedFunctionName}". Skipping 'blue' alias creation.`
            );
            // If you want to explicitly delete the 'blue' alias if it exists and only one version is left,
            // you'd add deletion logic here. For now, we just skip creation.
          }
        } catch (error) {
          this.serverless.cli.log(
            `[ERROR] Failed to manage Green/Blue aliases for function "${deployedFunctionName}": ${error.message}`,
            "ServerlessLambdaAliasPlugin",
            { color: "red" }
          );
          // Log the full error object for debugging

          // Check if the error is due to the function itself not being found
          if (
            error.name === "ResourceNotFoundException" ||
            error.name === "InvalidParameterValueException"
          ) {
            this.serverless.cli.log(
              `[ERROR] The Lambda function "${deployedFunctionName}" itself could not be found or is invalid. ` +
                `Please ensure the function name constructed by the plugin matches your deployed Lambda function in AWS.`,
              "ServerlessLambdaAliasPlugin",
              { color: "red" }
            );
          }
          this.serverless.cli.log(
            `[DEBUG] Raw error in manageGreenBlueAliases for function "${deployedFunctionName}":`,
            "ServerlessLambdaAliasPlugin",
            { color: "red" }
          );
          console.error(error);
          // You might want to throw the error to stop the deployment, or just log it.
          // throw new this.serverless.classes.Error(`Green/Blue alias management failed: ${error.message}`);
        }
      }
    }
    this.serverless.cli.log("Green/Blue Lambda alias management completed.");
  }
}

module.exports = ServerlessLambdaAliasPlugin;
