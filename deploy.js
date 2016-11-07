let exec = require('child_process').exec;
//TODO Clean up
let cmd = `$(npm bin)/jrp ${__dirname}/_posts && git add -A . && git commit -m "Adding meta data for related posts" && git push origin gh-pages`;

exec(cmd, (error, stdout, stderr) => {
  console.log(stdout);
  console.log(stderr);
  if (error !== null) {
      console.log(error);
  }
});
