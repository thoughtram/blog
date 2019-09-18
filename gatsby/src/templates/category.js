import React from "react"
import Layout from '../components/layout'
import SubNav from '../components/SubNav';
import PropTypes from "prop-types"
import Img from 'gatsby-image'
import { Link, graphql } from "gatsby"
import { upperCaseFirst } from '../utils/uppercase-first'

const Categories = ({ pageContext, data }) => {
  const siteTitle = data.site.siteMetadata.title
  const { category } = pageContext
  const { edges, totalCount } = data.allMarkdownRemark

  return (
    <Layout title={siteTitle}>
      <SubNav/>
      <div className="u-max-width--half">
        <section className="thtrm-section">
          <h1 className="thtrm-section__heading">{totalCount} Artikel in <strong>{category}</strong></h1>
          
          <div className="thtrm-listing">
            {edges.map(({ node }) => {
              const { slug } = node.fields
              const { title } = node.frontmatter
              const { description } = node.frontmatter
              const { summary } = node.frontmatter
              const { categories } = node.frontmatter
              const { imageUrl } = node.frontmatter
              const { date } = node.frontmatter
              return (
                <Link to={slug} key={slug} className="thtrm-raw-link thtrm-teaser thtrm-teaser--row thtrm-listing__item">
                  <div>
                    <div className="u-flex">
                      <time dateTime={date} className="thtrm-topic u-color--grey">{date}</time>
                      { categories && <p className="thtrm-topic u-color--grey">&nbsp; / {upperCaseFirst(categories[0])}</p>}
                    </div>
                    <h2 className="thtrm-title">{title}</h2> 
                    <p className="u-text--small u-color--grey u-distance-tiny">
                      {summary}
                    </p>
                  </div>
                  {imageUrl && <div className="thtrm-teaser__thumb">
                      <Img sizes={imageUrl.childImageSharp.sizes} />
                    </div>}
                </Link>
              )
            })}
          </div>
          <div className="thtrm-section__heading">
            <Link to="/categories" title="All Posts" className="thtrm-button">All Categories</Link>
          </div>
        </section>
      </div>
    </Layout>
  )
}

Categories.propTypes = {
  pageContext: PropTypes.shape({
    category: PropTypes.string.isRequired,
  }),
  data: PropTypes.shape({
    allMarkdownRemark: PropTypes.shape({
      totalCount: PropTypes.number.isRequired,
      edges: PropTypes.arrayOf(
        PropTypes.shape({
          node: PropTypes.shape({
            frontmatter: PropTypes.shape({
              title: PropTypes.string.isRequired
            }),
            fields: PropTypes.shape({
              slug: PropTypes.string.isRequired,
            }),
          }),
        }).isRequired
      ),
    }),
  }),
}

export default Categories

export const pageQuery = graphql`
  query($category: String) {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { categories: { in: [$category] } } }
    ) {
      totalCount
      edges {
        node {
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