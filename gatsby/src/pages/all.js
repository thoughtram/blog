import React from "react"
import { Link, graphql } from "gatsby"
import Layout from '../components/layout'
import SubNav from '../components/SubNav';
import ListingItem from '../components/ListingItem';

import '../assets/scss/main.scss';

class Posts extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const posts = data.allMarkdownRemark.edges

    return (
      <Layout title={siteTitle}>
        <SubNav/>
        <section className="thtrm-section u-max-width--3-4">
          <h2 className="thtrm-section__heading">All Stories</h2>

          <div className="thtrm-listing">
            {posts.map(post => {
              return (
                <ListingItem key={post.node.fields.slug} post={post.node}/>
              )
            })}
          </div>
          <div className="thtrm-section__footer">
            <Link to="/" title="back" className="thtrm-button">Back to Blog</Link>
          </div>
        </section>
      </Layout>
    )
  }
}

export default Posts

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
          frontmatter {
            date(formatString: "DD MMMM")
            title
            description
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
