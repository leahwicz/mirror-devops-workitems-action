const core = require('@actions/core');
const github = require('@actions/github');

try {
    // get the area path
    const areaPath = core.getInput('area-path');
    console.log(`Hello ${areaPath}!`);

  } catch (error) {
    core.setFailed(error.message);
  }