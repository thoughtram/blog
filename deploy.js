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

console.log('Getting ready for deployment...hold on!');
spawnIt(`$(npm bin)/jrp ${__dirname}/_posts`);
spawnIt(`git add -A . && git commit -m "chore: adds meta data for related posts and videos"`);
spawnIt(`git push origin gh-pages`)
console.log('Everything should be live at http://blog.thoughtram.io');
