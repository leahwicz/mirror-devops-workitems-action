const core = require('@actions/core');
const github = require('@actions/github');
const azdev = require('azure-devops-node-api');

const azpPAT = process.env['AZP_PAT'];

// Gets the node api for getting workitems
function getNodeApi() {
    let authHandler = azdev.getPersonalAccessTokenHandler(azpPAT); 
    let connection = new azdev.WebApi('https://dev.azure.com/mseng', authHandler);  
    return await connection.getWorkItemTrackingApi();
}

try {
    // get the area path
    const areaPath = core.getInput('area-path');
    console.log(`Area path to look for work items under ${areaPath}`);

    const nodeApi = getNodeApi();
    const wiql = `SELECT System.ID from workitems where [System.AreaPath] = '${areaPath}' AND [System.State] = 'Active'`;
    const items = await nodeApi.queryByWiql({query: wiql});


} catch (error) {
    core.setFailed(error.message);
}
