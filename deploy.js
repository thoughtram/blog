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
    //Doesn't feel write to swallow the exceptions but there doesn't seem
    //to be a built in way to supress exceptions if git add and git push fail
  }
}

const skipMeta = process.argv.includes('--skip-meta');
const force = process.argv.includes('--force');

const defaultBranch = 'master';
const deployBranch = 'gh-pages';
const stage1 = 'deploy-stage-1';
const stage2 = 'deploy-stage-2';

console.log(chalk.green('Getting ready for deployment...hold on!'));

console.log(chalk.green('Fetching from origin...'));
execute(`git fetch origin`);

let isBehindUpstream = execute('git log HEAD..origin/master --oneline').length > 0;

if (isBehindUpstream && !force) {
  console.log('Your current HEAD is behind origin/master. Use --force to ignore.')
  return;
}

if (!skipMeta) {
  // generate meta data for posts
  console.log('Generating meta data for posts (related posts & videos)...');
  execute(`$(npm bin)/jrp ${__dirname}/_posts`);
  execute(`git add -A . && git commit -m "chore: adds meta data for related posts and videos"`);
}

console.log(chalk.green('Performing jekyll build...'));
// perform jekyll build
execute(`jekyll build`);

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

// get contents from stage 2 and create a commit
execute(`git checkout ${deployBranch}`);
execute(`git checkout ${stage2} .`);
execute(`git add -A`);
execute(`git commit -m "rebuilt site"`);

console.log(chalk.green('Deploying...'));
execute(`git push origin ${deployBranch}`);

execute(`git checkout ${defaultBranch}`);

console.log(chalk.green('Everything should be live at http://blog.thoughtram.io'));