let spawnSync = require('child_process').execSync;
let spawnOptions = { stdio: 'inherit' };

console.log('Getting ready for deployment...hold on!');
spawnSync(`$(npm bin)/jrp ${__dirname}/_posts`, spawnOptions);
spawnSync(`git add -A .`, spawnOptions);
spawnSync(`git commit -m "Adding meta data for related posts"`, spawnOptions);
spawnSync(`git push origin gh-pages"`, spawnOptions);
console.log('Everything should be live at http://blog.thoughtram.io');
