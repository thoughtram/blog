import React from "react"
import { Link, graphql } from "gatsby"
import Img from 'gatsby-image';

import { upperCaseFirst } from '../utils/uppercase-first';
import LayoutWithSignUp from "../components/LayoutWithSignUp"
import AdCard from '../components/Ad'
import "prismjs/themes/prism-okaidia.css"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const author = this.props.data.site.siteMetadata.authors
                        .find(a => a.id === post.frontmatter.author)
    const category = post.frontmatter.categories[0];
    const categoryLink = `/categories/${category}`;
    const twitterLink = `https://twitter.com/${author.twitter}`;

    /* const { previous, next } = this.props.pageContext */

    return (
      <LayoutWithSignUp title={post.frontmatter.title} description={post.frontmatter.summary}>
        <nav className="thtrm-nav-toc">
         <Link to="/" title="Back to Blog">&larr; Back to Blog</Link>
        </nav>
        <section className="thtrm-section u-distance-bottom-reset">
          <div className="thtrm-section__heading thtrm-article-header thtrm-section-constrained u-distance-bottom-reset">
            <div className="thtrm-metabar thtrm-article-header__metabar">
              <div className="thtrm-metabar__item thtrm-topic u-color--grey">
                <div className="thtrm-media-short">
                  <img alt="Author" src={author.img} className="thtrm-avatar" />
                  <p className="thtrm-media-short__body"><a href={twitterLink} className="u-link-plain">{author.name}</a></p>
                </div>
              </div>
              <time dateTime={post.frontmatter.date} className="thtrm-metabar__item thtrm-topic u-color--grey">{post.frontmatter.date}</time>
              {post.frontmatter.categories && <p className="thtrm-metabar__item thtrm-topic u-color--grey"><Link to={categoryLink} className="u-link-plain">{upperCaseFirst(category)}</Link></p>}
            </div>
            <h1 className="thtrm-section__subheading u-distance-tiny">{post.frontmatter.title}</h1>
          </div>
          {post.frontmatter.imageUrl && <Img sizes={post.frontmatter.imageUrl.childImageSharp.sizes} className="thtrm-ratio--stripe thtrm-article-thumb u-fill-space u-img-fit-height"/>}
          {post.frontmatter.imgCaption && <p className="thtrm-article-caption u-color--grey">{post.frontmatter.imgCaption}</p>}
        </section>
        
        <section className="thtrm-section thtrm-section-constrained thtrm-article u-distance">
          <div className="thtrm-section__heading u-distance-reset" dangerouslySetInnerHTML={{ __html: post.html }} />
        </section>
        <section className="thtrm-section">
          <AdCard/>
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
        authors {
          id
          name
          twitter
          img
        }
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        author
        title
        author
        imageUrl {
          childImageSharp{
            sizes(maxWidth: 630) {
                ...GatsbyImageSharpSizes
            }
          }
        }
        date(formatString: "DD MMMM YYYY")
        summary
        description
        categories
      }
    }
  }
`
