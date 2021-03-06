import React from "react"
import { Link, graphql } from "gatsby"
import Layout from '../components/layout'
import SubNav from '../components/SubNav';
import Stage from '../components/Stage';
import Teaser from '../components/Teaser';
import ListingItem from '../components/ListingItem';

import '../assets/scss/main.scss';

class BlogIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const posts = data.allMarkdownRemark.edges
    const latestPost = posts[0].node;
    const morePosts = posts.slice(4, 8);

    return (
      <Layout title={siteTitle}>
        <SubNav/>
        <Stage post={latestPost}/>
        <section className="thtrm-section--fullbleed-intrinsic u-bg-lightgray">
          <div className="thtrm-layout thtrm-layout-thirds">
            <Teaser post={posts[1]} paragraphClass="u-color--grey"/>
            <Teaser post={posts[2]} paragraphClass="u-color--grey"/>
            <Teaser post={posts[3]} paragraphClass="u-color--grey"/>
          </div>
        </section>
        <section className="thtrm-section">
          <h2 className="thtrm-section__heading">More Stories</h2>

          <div className="thtrm-listing">
            {morePosts.map(post => {
              return (
                <ListingItem key={post.node.fields.slug} post={post.node}/>
              )
            })}
          </div>
          <div className="thtrm-section__heading">
            <Link to="/all" title="All Posts">All Stories</Link>
          </div>
        </section>
      </Layout>
    )
  }
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          tableOfContents
          frontmatter {
            date(formatString: "DD MMMM")
            title
            summary
            imageUrl {
              childImageSharp {
                sizes(maxWidth: 600) {
                  ...GatsbyImageSharpSizes
                }
              }
            }
            categories
          }
        }
      }
    }
  }
`
