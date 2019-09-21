import React from "react"
import { Link, graphql } from "gatsby"
import Layout from '../components/layout'

import '../assets/scss/main.scss';

class SubscriptionConfirmation extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title

    return (
      <Layout title={siteTitle}>
        <section className="thtrm-section--fullbleed-intrinsic u-bg-lightgray">
          <div class="thtrm-section__header u-max-width--half">
            <h2 class="thtrm-section__subheading">Awesome!</h2>
            <p>Your subscription was successful.</p>
            <Link to="/" title="Back to blog">Cool, take me back please!</Link>
          </div>
        </section>
      </Layout>
    )
  }
}

export default SubscriptionConfirmation

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
        }
      }
    }
  }
`

