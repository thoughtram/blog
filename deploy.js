let spawnSync = require('child_process').execSync;
let spawnOptions = { stdio: 'inherit' };

let spawnIt = (cmd) => {
  try {
    spawnSync(cmd, spawnOptions);
  }
  catch (e) {
    //Doesn't feel write to swallow the exceptions but there doesn't September
    //to be a built in way to supress exceptions if git add and git push fail
  }
}

console.log('Getting ready for deployment...hold on!');
spawnIt(`$(npm bin)/jrp ${__dirname}/_posts`);
spawnIt(`git add -A . && git commit -m "Adding meta data for related posts"`);
spawnIt(`git push origin gh-pages`)
console.log('Everything should be live at http://blog.thoughtram.io');
