import React from "react"
import { graphql } from "gatsby"
import Layout from '../components/layout'
import SubNav from '../components/SubNav';
import Stage from '../components/Stage';
import Teaser from '../components/Teaser';

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
            <Teaser post={posts[1]}/>
            <Teaser post={posts[2]}/>
            <Teaser post={posts[3]}/>
          </div>
        </section>
        <section className="thtrm-section">
          <h2 className="thtrm-section__heading">All Stories</h2>
          <div className="thtrm-listing">
            
            <a href="" className="thtrm-raw-link thtrm-teaser thtrm-teaser--row thtrm-listing__item">
              <div>
                <div className="u-flex">
                  <time datetime="" className="thtrm-topic u-color--grey">Sep 13</time>
                  <p className="thtrm-topic u-color--grey">&nbsp; / AngularJS</p>
                </div>
                <h2 className="thtrm-title">More peace of mind with new phone backup by Google One</h2>
              </div>
              <div className="thtrm-teaser__thumb">
                <img src="https://blog.thoughtram.io//images/banner/easy-dialogs-with-angular-material.jpg" alt="" />
              </div>
            </a>
            <a href="" className="thtrm-raw-link thtrm-teaser thtrm-teaser--row thtrm-listing__item">
              <div>
                <div className="u-flex">
                  <time datetime="" className="thtrm-topic u-color--grey">Sep 13</time>
                  <p className="thtrm-topic u-color--grey">&nbsp; / AngularJS</p>
                </div>
                <h2 className="thtrm-title">More peace of mind with new phone backup by Google One</h2>
              </div>
              <div className="thtrm-teaser__thumb">
                <img src="https://blog.thoughtram.io//images/banner/easy-dialogs-with-angular-material.jpg" alt="" />
              </div>
            </a>
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
