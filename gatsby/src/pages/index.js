import React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/layout"

import '../assets/scss/main.scss';

class BlogIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const posts = data.allMarkdownRemark.edges
    const latestPost = posts[0].node;

    return (
      <Layout title={siteTitle}>
        <nav className="thtrm-nav-toc">
          <ul>
            <li>Categories:</li>
            <li><a href="#section:public-private-or-hosted">Latest</a></li>
            <li><a href="#section:training-courses">Angular</a></li>
            <li><a href="#section:training-courses">Git</a></li>
          </ul>
        </nav>
        <section className="thtrm-section u-flex--nowrap">
          <div className="thtrm-section__item--halfpadded">
            <Link to={latestPost.fields.slug}>
              <h1 className="thtrm-section__heading">{latestPost.frontmatter.title}</h1>
              <p className="thtrm-section__paragraph">{latestPost.frontmatter.summary}</p>
              Read more
            </Link>
          </div>
          <div className="thtrm-section__item--flushright">
            <div className="thtrm-section__image thtrm-ratio--landscape">
              <img src={ "https://blog.thoughtram.io/" + latestPost.frontmatter.imageUrl}
                  srcset={ "https://blog.thoughtram.io/" + latestPost.frontmatter.imageUrl + ' 600w'}
                  sizes="(min-width: 700px) 40vw, 90vw"
                  alt="A picture"/>
            </div>
          </div>
        </section>
        <section className="thtrm-section--fullbleed-intrinsic u-bg-lightgray">
          <div className="thtrm-layout thtrm-layout-thirds">
            <div className="thtrm-card thtrm-card--white">
              <h4 className="thtrm-card__topic thtrm-card__topic--grey">{posts[1].node.frontmatter.categories[0]}</h4>
              <h3 className="thtrm-card__heading">{posts[1].node.frontmatter.title}</h3>
              <p className="thtrm-card__paragraph">{posts[1].node.frontmatter.summary}</p>
              <Link className="thtrm-section__link" to={posts[1].node.fields.slug}>Read more</Link>
            </div>
            <div className="thtrm-card thtrm-card--white">
              <h4 className="thtrm-card__topic thtrm-card__topic--grey">{posts[2].node.frontmatter.categories[0]}</h4>
              <h3 className="thtrm-card__heading">{posts[2].node.frontmatter.title}</h3>
              <p className="thtrm-card__paragraph">{posts[2].node.frontmatter.summary}</p>
              <Link className="thtrm-section__link" to={posts[2].node.fields.slug}>Read more</Link>
            </div>
            <div className="thtrm-card thtrm-card--white">
              <h4 className="thtrm-card__topic thtrm-card__topic--grey">{posts[3].node.frontmatter.categories[0]}</h4>
              <h3 className="thtrm-card__heading">{posts[3].node.frontmatter.title}</h3>
              <p className="thtrm-card__paragraph">{posts[3].node.frontmatter.summary}</p>
              <Link className="thtrm-section__link" to={posts[3].node.fields.slug}>Read more</Link>
            </div>
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
