#!/bin/bash

# switch to a temporally branch
git branch -D temp
git checkout -b temp

echo -e "\033[0;32mDeploying updates to Github...\033[0m"

# Build the project.
./hugo

# Add changes to git.
git add -A
git add -f public

# Commit changes.
msg="rebuilding site `date`"
if [ $# -eq 1 ]
  then msg="$1"
fi
git commit -m "$msg"

# Push source and build repos.
git push origin master
git branch -D gh-pages
git subtree split -P public -b gh-pages
git push -f origin gh-pages:gh-pages
git checkout master
git branch -D temp
