#!/usr/bin/env node

let spawnSync = require('child_process').execSync;
let spawnOptions = { stdio: 'inherit' };

let spawnIt = (cmd) => {
  try {
    spawnSync(cmd, spawnOptions);
  }
  catch (e) {
    //Doesn't feel write to swallow the exceptions but there doesn't seem
    //to be a built in way to supress exceptions if git add and git push fail
  }
}

const skipMeta = process.argv.includes('--skip-meta');

const defaultBranch = 'master';
const deployBranch = 'gh-pages';
const stage1 = 'deploy-stage-1';
const stage2 = 'deploy-stage-2';

console.log('Getting ready for deployment...hold on!');

if (!skipMeta) {
  // generate meta data for posts
  spawnIt(`$(npm bin)/jrp ${__dirname}/_posts`);
  spawnIt(`git add -A . && git commit -m "chore: adds meta data for related posts and videos"`);
}

// perform jekyll build
spawnIt(`jekyll build`);

// cleanup temp branches
spawnIt(`git branch -D ${stage1}`);
spawnIt(`git branch -D ${stage2}`);

// prepare stage 1
spawnIt(`git checkout -b ${stage1}`);
spawnIt(`git add -f _site`);
spawnIt(`git commit -m "${stage1}"`);

// prepare stage 2
spawnIt(`git subtree split -P _site -b ${stage2}`);

// get contents from stage 2 and create a commit
spawnIt(`git checkout ${deployBranch}`);
spawnIt(`git checkout ${stage2} .`);
spawnIt(`git add -A`);
spawnIt(`git commit -m "rebuilt site"`);

spawnIt(`git push origin ${deployBranch}`);

spawnIt(`git checkout ${defaultBranch}`);

console.log('Everything should be live at http://blog.thoughtram.io');