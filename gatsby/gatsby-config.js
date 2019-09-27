const authors = require('./authors');
const autoprefixer = require('autoprefixer');

const title = 'Articles by thoughtram';
const author = 'thoughtram';
const description = 'High-quality, in-depth technical articles on Rust, Angular, Git and more by thoughtram.';

module.exports = {
  siteMetadata: {
    title,
    author,
    authors,
    description,
    siteUrl: `https://blog.thoughtram.io`,
    social: {
      twitter: `thoughtram`,
    },
  },
  plugins: [
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        tableOfContents: {
          heading: "dasdas",
          maxDepth: 6,
        },
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        //trackingId: `ADD YOUR TRACKING ID HERE`,
      },
    },
    `gatsby-plugin-feed`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: title,
        description,
        short_name: `thoughtram blog`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#384c54`,
        display: `minimal-ui`,
        icon: `src/assets/images/touch/icon-128x128.png`,
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: 'gatsby-plugin-sass',
      options: {
        postCssPlugins: [autoprefixer()],
        cssLoaderOptions: {
          camelCase: false,
        }
      }
    }
  ],
}
