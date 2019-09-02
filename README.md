# thoughtram Blog


We use Jekyll as static site generator. You can read its docs [here](http://jekyllrb.com/docs/home/).


```terminal
sudo gem install jekyll
sudo gem install jekyll-redirect-from
sudo gem install jekyll-paginate

jekyll serve
```

## Using docker

This blog requires `ruby`, `jekyll` and a bunch of other dependencies in specific versions. Managing these dependencies can become difficult over time and often the simplest solution is to use `docker`.

**NOTE: Depending on the `docker` installation, the following commands might need to be run using `sudo`.**

| Action    |      Local Jekyll   |  Using Docker                    |
|-----------|---------------------|----------------------------------|
| Building  | `jekyll build`      | `yarn docker-jekyll-build`       |
| Serving   | `jekyll serve`      | `yarn docker-jekyll-serve`       |
| Deplyoing | `yarn deploy [...]` | `yarn deploy --use-docker [...]` |

### Caveats

These commands are intended to be used as straight forward replacements. There's one caveat though: They don't let one use additional parameters. E.g. one can not change the default port for serving, it is hard-wired to serve the site on `http://localhost:4000`.