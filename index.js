const core = require('@actions/core');
const github = require('@actions/github');
const azdev = require('azure-devops-node-api');

// Gets the node api for getting workitems
async function getNodeApi(azpToken, azpOrg) {
    let authHandler = azdev.getPersonalAccessTokenHandler(azpToken); 
    let connection = new azdev.WebApi('https://dev.azure.com/' + azpOrg, authHandler);  
    return await connection.getWorkItemTrackingApi();
}

async function getWorkItems(azpPAT, azpOrg, areaPath, workItemType) {
    console.log('Getting existing Azure DevOps work items...');
    // query by WIQL to get work item ids that match criteria
    const nodeApi = await getNodeApi(azpPAT, azpOrg);
    const filterOnType = workItemType ? `[System.WorkItemType] = '${workItemType}' AND` : ``
    const escapedPath = areaPath.replace(/[\\"']/g, '\\$&')
    const wiql = `SELECT [System.Id], [System.WorkItemType], [System.Title], [System.State] from workitems where ${filterOnType} [System.AreaPath] UNDER '${escapedPath}' AND [System.State] = '5 - PG Engaged'`;
    console.log(wiql)
    
    const result = await nodeApi.queryByWiql({query: wiql});

    const count = result['workItems'].length;
    console.log(`Azure DevOps work items that match: ${count}\n`);

    var workItemIds = result.workItems.map(function (wi) { return wi.id; });
    let items = await nodeApi.getWorkItems(workItemIds, ["System.Id", "System.WorkItemType", "System.Title"]);

    return items;
}

async function getExistingIssues(octokit, labelFilter, issuePrefix) {
    console.log('Getting existing GitHub issues...');
    const options = octokit.issues.listForRepo.endpoint.merge({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        state: 'open',
        labels: labelFilter
    });

    const issuesAndPulls = await octokit.paginate(options);

    return issuesAndPulls.filter((value) => {
        return !value.pull_request && value.title.startsWith(issuePrefix);
    }).map(function(issue) { return issue.title; });
}

async function createIssues(octokit, existingIssues, workItems, labelForIssues, issuePrefix) {
    console.log(`GitHub issues that match: ${existingIssues.length}\n`);

    workItems.forEach(item => {
        var str = JSON.stringify(item, null, 4); 
        console.log(str);

        if (existingIssues.some(v => v.includes(`${item.id}`))) {
            console.log("Work item '" + item.id + "' already has an issue created for it");
        } else {
            console.log("Creating issue for work item '" + item.id + "'");

            // Create bug info
            const prefix = issuePrefix ? issuePrefix : `[Work item`
            const title = `${prefix} ${item.id}] ${item.fields['System.Title']}`;
            const url = `${item.url}`.replace("_apis/wit/workItems", "_workitems/edit");
            const description = `Please look at work item ${item.id} that has been opened here:\n${url}`
            console.log("Work item URL '" + description + "'" + title);

            octokit.issues.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: title,
                body: description,
                labels: labelForIssues.split(',')
            });
        }
    });
}

async function run()
{
    try {
        // get inputs
        const azpPAT = core.getInput('ado-token', { required: true });
        const githubPAT = core.getInput('repo-token', { required: true });
        const azpOrg = core.getInput('org-name', { required: true });
        const areaPath = core.getInput('area-path', { required: true });
        const labelFilter = core.getInput('label-filter', { required: false });
        const labelForIssues = core.getInput('labels-for-issues', { required: false });
        const workItemType = core.getInput('work-item-type', { required: false });
        const issuePrefix = core.getInput('issue-prefix', { required: false });

        // create GitHub connection
        const octokit = new github.GitHub(githubPAT);

        const workItems = await getWorkItems(azpPAT, azpOrg, areaPath, workItemType);
        if (workItems && workItems.length > 0) {
            const existingIssues = await getExistingIssues(octokit, labelFilter, issuePrefix); 
            createIssues(octokit, existingIssues, workItems, labelForIssues, issuePrefix);
        } else {
            console.log("No new work items were found to mirror over")
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run()
