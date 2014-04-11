thoughtram blog
============

### How do I write a blog post

1. Write your post in markdown and save it to `content/posts/the-url-I-want-it-to-have.md`

Make sure that all assets of your blog post (images, videos etc) are saved to
`static/the-url-of-the-blog-post/some-image.png`

It's a current limitation of hugo that assets can't be placed directly into the content
folder next to the blog post. It will go away with a future version of hugo.

If you like to preview your blog post locally (you most certainly want!), you can do so
with `./hugo server --watch`. It will be accessible at `localhost:1313`

3. Commit your blog post to the master branch

4. run `./deploy_mac.sh`

5. Enjoy


### FAQ

**Do I need to install Hugo?**

Nope, it's a binary file, directly placed in the root of the repository.

**Why do I have to prepend `./` to the hugo command?**

You don't have to if you have hugo installed globally on your machine.
To make things plain simple hugo does not need to be installed though.
With ./hugo you make sure to just use the hugo binary from the root folder
of the repository.

