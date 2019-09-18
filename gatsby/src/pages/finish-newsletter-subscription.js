import React from "react"
import { Link, graphql } from "gatsby"
import Layout from '../components/layout'
import SubNav from '../components/SubNav';
import Stage from '../components/Stage';
import Teaser from '../components/Teaser';
import ListingItem from '../components/ListingItem';

import '../assets/scss/main.scss';

class FinishNewsletterSubscription extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title

    return (
      <Layout title={siteTitle}>
        <section className="thtrm-section--fullbleed-intrinsic">
          <div class="thtrm-section__header u-max-width--half">
            <h2 class="thtrm-section__subheading">Almost finished...</h2>
            <p>We need to confirm your email address. To complete the subscription process, please click the link in the email we just sent you.</p>
            <Link to="/" title="Back to website">Alrighty, back to website please!</Link>
          </div>
        </section>
      </Layout>
    )
  }
}

export default FinishNewsletterSubscription

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
