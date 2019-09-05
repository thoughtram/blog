import React from "react"
import { graphql } from "gatsby"
import Layout from '../components/layout'
import SubNav from '../components/SubNav';
import Stage from '../components/Stage';
import Card from '../components/Card';

import '../assets/scss/main.scss';

class BlogIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const posts = data.allMarkdownRemark.edges
    const latestPost = posts[10].node;

    return (
      <Layout title={siteTitle}>
        <SubNav/>
        <Stage post={latestPost}/>
        <section className="thtrm-section--fullbleed-intrinsic u-bg-lightgray">
          <div className="thtrm-layout thtrm-layout-thirds">
            <Card post={posts[1]}/>
            <Card post={posts[2]}/>
            <Card post={posts[3]}/>
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
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            description
            summary
            imageUrl
            categories
          }
        }
      }
    }
  }
`
