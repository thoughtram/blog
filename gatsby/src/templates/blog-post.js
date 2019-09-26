import React from "react"
import { Link, graphql } from "gatsby"
import Img from 'gatsby-image';

import { upperCaseFirst } from '../utils/uppercase-first';
import LayoutWithSignUp from "../components/LayoutWithSignUp"
import SubNav from '../components/SubNav'
import "prismjs/themes/prism-okaidia.css"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = this.props.data.site.siteMetadata.title
    const { previous, next } = this.props.pageContext

    return (
      <LayoutWithSignUp title={post.frontmatter.title}>
        <SubNav/>
        <section className="thtrm-section u-distance-bottom-reset">
          <div className="thtrm-section__heading thtrm-article-header thtrm-section-constrained u-distance-bottom-reset">
            <div className="thtrm-metabar thtrm-article-header__metabar">
              <div className="thtrm-metabar__item thtrm-topic u-color--grey">
                <div className="thtrm-media-short">
                  <Img sizes={post.frontmatter.imageUrl.childImageSharp.sizes} className="thtrm-avatar" />
                  <p className="thtrm-media-short__body">Tim Hartmann</p>
                </div>
              </div>
              <time dateTime={post.frontmatter.date} className="thtrm-metabar__item thtrm-topic u-color--grey">{post.frontmatter.date}</time>
              {post.frontmatter.categories && <p className="thtrm-metabar__item thtrm-topic u-color--grey">{upperCaseFirst(post.frontmatter.categories[0])}</p>}
            </div>
            <h1 className="thtrm-section__subheading u-distance-tiny">{post.frontmatter.title}</h1>
          </div>
          {post.frontmatter.imageUrl && <Img sizes={post.frontmatter.imageUrl.childImageSharp.sizes} className="thtrm-ratio--stripe thtrm-article-thumb u-fill-space u-img-fit-height"/>}
        </section>
        
        <section className="thtrm-section thtrm-section-constrained thtrm-article u-distance">
          <div className="thtrm-section__heading u-distance-reset" dangerouslySetInnerHTML={{ __html: post.html }} />
        </section>
        <section className="thtrm-section">
          <div className="thtrm-card thtrm-section__heading">
            <div className="thtrm-media thtrm-media--top-start">
              <img src="https://www.rust-lang.org/static/images/rust-logo-blk.svg" alt="" className="thtrm-media__asset" />
              <div className="thtrm-media__body">
                <h2>Learn Rust the right way</h2>
                <p>Our Online Course is the best material for JS Developers.</p>
                <ul className="thtrm-card__list">
                  <li>Introduction</li>
                  <li>Architecture</li>
                  <li>API</li>
                </ul>
                <a href="" className="thtrm-button u-distance-small">Explore Course</a>
              </div>
            </div>
          </div>
        </section>
        
      </LayoutWithSignUp>
    )
  }
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        imageUrl {
          childImageSharp{
            sizes(maxWidth: 630) {
                ...GatsbyImageSharpSizes
            }
          }
        }
        date(formatString: "DD. MMMM YYYY")
        description
        categories
      }
    }
  }
`
