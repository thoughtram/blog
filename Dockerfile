FROM ruby:2.5

RUN gem install jekyll -v 3.8
RUN gem install jekyll-paginate -v 1.1
RUN gem install jekyll-redirect-from -v 0.15

EXPOSE 4000

CMD ["/bin/sh"]

# This Docker container is intended to only provide the necessary environment to
# build the blog. It does not know about the blog itself. One should provide a
# blog as a mount point and use this soley as a safe-heaven jekyll environment.

# E.g. sudo docker run -it --mount src="$(pwd)",target=/blog,type=bind thoughtram/blog:latest cd /blog && jekyll build
