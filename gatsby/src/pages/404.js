import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"

class NotFoundPage extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO title="404: Not Found" />
        <section className="thtrm-section thtrm-section--centered u-flex--justify-center">
          <div>
            <h1 className="thtrm-section__heading">Lost in Space.</h1>
            <p>The page you have requested could not be found.</p>
            <div className="thtrm-section__footer">
              <Link to="/all">Take me to all blog posts</Link>
            </div>
          </div>
        </section>
      </Layout>
    )
  }
}

export default NotFoundPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
