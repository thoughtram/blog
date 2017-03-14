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

const deployBranch = 'deploy';
const stage1 = 'deploy-stage-1';
const stage2 = 'deploy-stage-2';

// console.log('Getting ready for deployment...hold on!');
// spawnIt(`$(npm bin)/jrp ${__dirname}/_posts`);
// spawnIt(`git add -A . && git commit -m "chore: adds meta data for related posts and videos"`);
// spawnIt(`git push origin gh-pages`)
// console.log('Everything should be live at http://blog.thoughtram.io');

spawnIt(`jekyll build`);
spawnIt(`git branch -D ${stage1}`);
spawnIt(`git branch -D ${stage2}`);
spawnIt(`git checkout -b ${stage1}`);
spawnIt(`git add -f _site`);
spawnIt(`git commit -m "${stage1}"`);
spawnIt(`git subtree split -P _site -b ${stage2}`);
spawnIt(`git checkout ${deployBranch}`);
spawnIt(`git checkout ${stage2} .`);
spawnIt(`git add -A`);
spawnIt(`git commit -m "rebuilt site"`);