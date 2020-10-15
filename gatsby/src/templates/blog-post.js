import React from "react"
import { Link, graphql } from "gatsby"
import Img from 'gatsby-image';
import rebaseBanner from '../assets/images/rebase-banner.svg';
import ScriptTag from "react-script-tag"

import { upperCaseFirst } from '../utils/uppercase-first';
import Layout from '../components/layout';
import "prismjs/themes/prism-okaidia.css"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const author = this.props.data.site.siteMetadata.authors
                        .find(a => a.id === post.frontmatter.author)
    const category = post.frontmatter.categories && post.frontmatter.categories[0];
    const isRust = category === 'rust';
    const categoryLink = `/categories/${category}`;
    const twitterLink = `https://twitter.com/${author.twitter}`;

    /* const { previous, next } = this.props.pageContext */

    return (
      <Layout title={post.frontmatter.title} description={post.frontmatter.summary}>
        <nav className="thtrm-nav-toc">
         <Link to="/" title="Back to Blog">&larr; Back to Blog</Link>
        </nav>
        <div
          style={{ margin: "auto", textAlign: "center", minHeight: "30px" }}
          id="codefund"
        ></div>
        <ScriptTag
          type="text/javascript"
          src="https://app.codefund.io/properties/723/funder.js"
          async={true}
        />
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
              {category && <p className="thtrm-metabar__item thtrm-topic u-color--grey"><Link to={categoryLink} className="u-link-plain">{upperCaseFirst(category)}</Link></p>}
            </div>
            <h1 className="thtrm-section__subheading u-distance-tiny">{post.frontmatter.title}</h1>
          </div>
          {post.frontmatter.imageUrl && <Img sizes={post.frontmatter.imageUrl.childImageSharp.sizes} className="thtrm-ratio--stripe thtrm-article-thumb u-fill-space u-img-fit-height"/>}
          {post.frontmatter.imgCaption && <p className="thtrm-article-caption u-color--grey">{post.frontmatter.imgCaption}</p>}
        </section>

        <section className="thtrm-section thtrm-section-constrained thtrm-article u-distance">
          {category == 'rust' && <p style={{textAlign: 'center', fontStyle: 'italic', width: '100%', marginBottom: '1em'}}>New to Rust? Check out my <strong>free</strong> <a href="https://egghead.io/courses/write-your-first-program-with-the-rust-language" target="_blank">introduction course</a>!</p>}
          <div className="thtrm-section__heading u-distance-reset" dangerouslySetInnerHTML={{ __html: post.html }} />
        </section>
        { isRust && (
          <section className="thtrm-section--centered thtrm-section-constrained u-flex--justify-center" style={{boxShadow: "0px 2px 9px 2px rgba(0,0,0, 0.1)", padding: "2em", marginTop: "-2em"}}>
            <h1 className="thtrm-section__heading--small">Liked this Rust article?</h1>
            <form id="signup-form" method="post" className="thtrm-form u-distance-small" action="https://gmail.us3.list-manage.com/subscribe/post?u=06cf39a53e3ac1a4db816a8f1&amp;id=08cf21d77b" noValidate target="_blank">
              <p className="thtrm-section__paragraph thtrm-section__paragraph--small" style={{lineHeight: "1.4em", fontSize: "0.7em", marginTop: "-1em"}}>
                I started learning Rust out of curiosity with zero experience in systems programming. I know the pain. <span style={{fontWeight: "600"}}>Learning Rust doesn't have to be hard</span>. If you liked the article, sign up here and I'll inform you about new Rust content. ✌🏼</p>
              <div className="thtrm-form__row thtrm-form__column-group u-distance">
                <input type="text" nane="FNAME" id="mce-FNAME" className="thtrm-form__input--text" placeholder="Your firstname" />
                <input type="email" name="EMAIL" id="mce-EMAIL" className="thtrm-form__input--text" placeholder="Your email" />
              </div>
              <div className="thtrm-form__row">
                <button type="submit" className="thtrm-button">Help me learn Rust!</button>
              </div>
            </form>
          </section>
        )}
        <section className="thtrm-section">
          <div className="thtrm-section__heading thtrm-article-header thtrm-section-constrained u-distance-reset">
            <div className="thtrm-metabar thtrm-article-header__metabar">
              <div className="thtrm-metabar__item thtrm-topic u-color--grey">
                <div className="thtrm-media-short">
                  Written by&nbsp; <img alt="Author" src={author.img} className="thtrm-avatar" />
                  <p className="thtrm-media-short__body"><a href={twitterLink} className="u-link-plain">{author.name}</a></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
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
        categories
      }
    }
  }
`
