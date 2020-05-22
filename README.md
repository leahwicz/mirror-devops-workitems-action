# Mirror DevOps Workitems Action
Using Azure DevOps and GitHub?
Tired of looking at 2 different workitem systems and losing track of what's in progress?
Trying to consolidate to track your work in one place?
This is the Action for you!

This workflow will query Azure DevOps looking for workitems that meet your criteria. It then open an issue on GitHub with a link back to the original Azure DevOps workitem. This allows you to track your work in 1 place even when spanning 2 products.

# Future Features
Coming soon - the option to copy the workitem contents to the GitHub issue and the close out the workitem in Azure DevOps.

## Usage
See [action.yml](action.yml) For comprehensive list of options.

Example:
```
name: Mirror Azure DevOps workitems to GitHub issues

# Run once a day
on:
  schedule: 
  - cron: "0 * * *"

jobs:
  mirror_job:
    runs-on: ubuntu-latest
    steps:
    - name: Mirror bugs
      uses: leahwicz/mirror-devops-workitems-action@master
      with:
        area-path: Org\Team\Bugs
        repo-token: "${{ secrets.GH_TOKEN }}"
        ado-token: "${{ secrets.ADO_SECRET }}"
        org-name: OrgName
        labels-for-issues: "Bug"
        issue-prefix: "[Bug"
        work-item-status: Active 
```
