import React from "react"
import { Link, graphql } from "gatsby"
import Img from 'gatsby-image';

import { upperCaseFirst } from '../utils/uppercase-first';
import Layout from "../components/layout"
import SubNav from '../components/SubNav'
import "prismjs/themes/prism-tomorrow.css"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = this.props.data.site.siteMetadata.title
    const { previous, next } = this.props.pageContext

    return (
      <Layout title={post.frontmatter.title}>
        <SubNav/>
        <section className="thtrm-section--fullbleed-intrinsic">
          <div className="thtrm-section__heading u-max-width--half">
            <div className="u-flex">
              <time dateTime="05 March" className="thtrm-topic u-color--grey">{post.frontmatter.date}</time>
              <p className="thtrm-topic u-color--grey">&nbsp; / {upperCaseFirst(post.frontmatter.categories[0])}</p>
            </div>
            <h1 className="thtrm-section__subheading">{post.frontmatter.title}</h1>
          </div>
          <Img sizes={post.frontmatter.imageUrl.childImageSharp.sizes} className="thtrm-ratio--stripe u-fill-space u-img-fit-height"/>
        </section>
        
        <section className="thtrm-section--fullbleed-intrinsic thtrm-article">
          <div className="thtrm-section__heading u-max-width--half u-distance-reset" dangerouslySetInnerHTML={{ __html: post.html }} />
        </section>
        
      </Layout>
      /* <Layout location={this.props.location} title={siteTitle}> */
      /*   <SEO */
      /*     title={post.frontmatter.title} */
      /*     description={post.frontmatter.description || post.excerpt} */
      /*   /> */
      /*   <article> */
      /*     <header> */
      /*       <h1 */
      /*         style={{ */
      /*           marginTop: rhythm(1), */
      /*           marginBottom: 0, */
      /*         }} */
      /*       > */
      /*         {post.frontmatter.title} */
      /*       </h1> */
      /*       <p */
      /*         style={{ */
      /*           ...scale(-1 / 5), */
      /*           display: `block`, */
      /*           marginBottom: rhythm(1), */
      /*         }} */
      /*       > */
      /*         {post.frontmatter.date} */
      /*       </p> */
      /*     </header> */
      /*     <section dangerouslySetInnerHTML={{ __html: post.html }} /> */
      /*     <hr */
      /*       style={{ */
      /*         marginBottom: rhythm(1), */
      /*       }} */
      /*     /> */
      /*     <footer> */
      /*       <Bio /> */
      /*     </footer> */
      /*   </article> */

      /*   <nav> */
      /*     <ul */
      /*       style={{ */
      /*         display: `flex`, */
      /*         flexWrap: `wrap`, */
      /*         justifyContent: `space-between`, */
      /*         listStyle: `none`, */
      /*         padding: 0, */
      /*       }} */
      /*     > */
      /*       <li> */
      /*         {previous && ( */
      /*           <Link to={previous.fields.slug} rel="prev"> */
      /*             ← {previous.frontmatter.title} */
      /*           </Link> */
      /*         )} */
      /*       </li> */
      /*       <li> */
      /*         {next && ( */
      /*           <Link to={next.fields.slug} rel="next"> */
      /*             {next.frontmatter.title} → */
      /*           </Link> */
      /*         )} */
      /*       </li> */
      /*     </ul> */
      /*   </nav> */
      /* </Layout> */
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