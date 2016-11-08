let spawnSync = require('child_process').execSync;
let spawnOptions = { stdio: 'inherit' };
console.log('foo');
spawnSync(`$(npm bin)/jrp ${__dirname}/_posts`, spawnOptions);
spawnSync(`git add -A .`, spawnOptions);
spawnSync(`git commit -m "Adding meta data for related posts"`, spawnOptions);
