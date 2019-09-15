const path = require(`path`)
const slugify = require('slugify');
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post.js`)
  const result = await graphql(
    `
      {
        allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 1000
        ) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                date(formatString: "YYYY/MM/DD")
                title
                categories
              }
            }
          }
        }
      }
    `
  )

  if (result.errors) {
    throw result.errors
  }

  // Create blog posts pages.
  const posts = result.data.allMarkdownRemark.edges

  posts.forEach((post, index) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    /* console.log('POST', post); */
    
    /* let path = createPath(post.node); */
    
    /* console.log('PATH', path); */

    createPage({
      path: post.node.fields.slug,
      component: blogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    })
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const { categories } = node.frontmatter;
    const filename = createFilePath({ node, getNode});

/* FILENAME /2019-09-02-more-GDE-power-at-thoughtram/ */
/* MATCH [ */
/*   '/2019-09-02-more-GDE-power-at-thoughtram/', */
/*   '2019-09-02', */
/*   'more-GDE-power-at-thoughtram', */
/*   index: 0, */
/*   input: '/2019-09-02-more-GDE-power-at-thoughtram/', */
/*   groups: undefined */
/* ] */
    /* console.log('FILENAME', filename); */
    const match = filename.match(/^\/([\d]{4}-[\d]{2}-[\d]{2})-{1}(.+)\/$/)

    let slug;

    if (match) {
      const date = match[1];
      const titleSlug = match[2];
      
      if (categories) {
        slug = `/${slugify(
          categories.concat([date]).join("-"),
          "/"
        )}/${titleSlug}.html`
      } else {
        slug = `/${date.replace('-', '/')}/${titleSlug}.html`
      }
    } else {
      slug = `${filename}.html`;
    }
    console.log('SLUG', slug);
    createNodeField({ node, name: `slug`, value: filename })
    /* createNodeField({ node, name: `date`, value: date }) */


    /* const value = createFilePath({ node, getNode }) */
    /* createNodeField({ */
    /*   name: `slug`, */
    /*   node, */
    /*   value, */
    /* }) */

    /* createNodeField({ */
    /*   name: 'path', */
    /*   node, */
    /*   value: createPath(node) */
    /* }); */
  }
}

/* function createPath(node) { */
/*   let path; */

/*   if (node.frontmatter.categories) { */
/*     path = `${node.frontmatter.categories[0]}/${node.frontmatter.date}${node.fields.slug}`; */
/*   } else { */
/*     path = node.fields.slug; */
/*   } */

/*   return path; */
/* } */
