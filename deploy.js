#!/usr/bin/env node

let execSync = require('child_process').execSync;
let chalk = require('chalk');
let spawnOptions = { stdio: 'pipe' };

let execute = (cmd) => {
  try {
    let output = execSync(cmd, spawnOptions).toString();
    console.log(output);
    return output;
  }
  catch (e) {
    console.error(chalk.red(e.toString()))
  }
}

const metaOnly = process.argv.includes('--meta-only');
const skipMeta = process.argv.includes('--skip-meta');
const force = process.argv.includes('--force');
const noPush = process.argv.includes('--no-push');
const useDocker = process.argv.includes('--use-docker');

const defaultBranch = 'master';
const deployBranch = 'gh-pages';
const stage1 = 'deploy-stage-1';
const stage2 = 'deploy-stage-2';

console.log(chalk.green('Getting ready for deployment...hold on!'));

console.log(chalk.green('Enforcing yarn install...'));
execute(`yarn install`);

console.log(chalk.green('Fetching from origin...'));
execute(`git fetch origin`);

if (!skipMeta) {
  // generate meta data for posts
  console.log('Generating meta data for posts (related posts & videos)...');
  execute(`$(npm bin)/jrp ${__dirname}/_posts`);

  if (metaOnly) {
    return;
  }

  execute(`git add -A . && git commit -m "chore: adds meta data for related posts and videos"`);
}

let isBehindUpstream = execute('git log HEAD..origin/master --oneline').length > 0;

if (isBehindUpstream && !force) {
  console.log('Your current HEAD is behind origin/master. Use --force to ignore.')
  return;
}

console.log(chalk.green('Performing jekyll build...'));
// perform jekyll build

if (useDocker) {
  execute(`./docker-jekyll-build`);
} else {
  execute(`jekyll build`);
}


console.log(chalk.green('Generating deploy artifacts...'));
// cleanup temp branches
execute(`git branch -D ${stage1}`);
execute(`git branch -D ${stage2}`);

// make sure deploy branch is reset to latest version from origin
execute(`git branch -f ${deployBranch} origin/${deployBranch}`);

// prepare stage 1
execute(`git checkout -b ${stage1}`);
execute(`git add -f _site`);
execute(`git commit -m "${stage1}"`);

// prepare stage 2
execute(`git subtree split -P _site -b ${stage2}`);

execute(`git checkout ${deployBranch}`);

// it's important ot wipe all files in the working directory
// because `checkout <branch> .` will get all contents from
// <branch> but it will also leave all files around that where
// in the working directory before and were not overwritten by
// anything from <branch>
execute(`git rm -rf . && git clean -fxd`);

// get contents from stage 2 and create a commit
execute(`git checkout ${stage2} .`);
execute(`git add -A`);
execute(`git commit -m "rebuilt site"`);

if (!noPush) {
  console.log(chalk.green('Deploying...'));
  execute(`git push origin ${deployBranch}`);
  console.log(chalk.green('Everything should be live at http://blog.thoughtram.io'));
} else {
  console.log(chalk.green(`--no-push used. Please check latest commit in ${deployBranch} and push manually`));
}


execute(`git checkout ${defaultBranch}`);


// cleanup temp branches
execute(`git branch -D ${stage1}`);
execute(`git branch -D ${stage2}`);
