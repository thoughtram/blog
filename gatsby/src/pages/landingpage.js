import React from "react"
import { graphql } from "gatsby"
import Layout from '../components/layout'
import SubNav from '../components/SubNav';
import Teaser from '../components/Teaser';

import '../assets/scss/main.scss';

class Landingpage extends React.Component {
  render() {
    const { data } = this.props
    const posts = data.allMarkdownRemark.edges
    const siteTitle = data.site.siteMetadata.title

    return (
      <Layout title={siteTitle}>
        <SubNav/>
        <section className="thtrm-section">
          <div className="thtrm-section__hero">
            <div className="thtrm-section__hero-image">
              <img src="https://www.rust-lang.org/static/images/rust-logo-blk.svg" alt=""/>
            </div>
            <h1 className="thtrm-section__heading">Rust For JavaScript Developers</h1>
            <p className="thtrm-section__paragraph">
               I started learning Rust out of curiosity with zero experience in systems programming. I know the pain. With Rust for JavaScript Developers I'm creating an online resource with free content about the Rust programming language, primarily (but not only) aimed at developers with a strong JavaScript background.
            </p>
            <form action="" className="thtrm-form u-distance-medium" id="sign-in">
              <div className="thtrm-form__row thtrm-form__column-group">
                <label htmlFor="">First name</label>
                <input type="text" nane="firstname" className="thtrm-form__input--text" placeholder="" />
                <label htmlFor="">Email Address</label>
                <input type="mail" name="mail" className="thtrm-form__input--text" placeholder="" />
              </div>
              <div className="thtrm-form__row">
                <button type="submit" className="thtrm-button">Learn Rust</button>
              </div>
              <p className="thtrm-section__paragraph u-color--grey u-distance">Subscribe now and get notified when I publish the first content!</p>
            </form>
          </div>
        </section>
        <section className="thtrm-section--fullbleed-intrinsic">
          <div className="thtrm-section__header u-max-width--half">
            <h2 className="thtrm-section__subheading">Course (coming soon)</h2>
            <p>Throughout this training we will build a real world Angular application teaching you all essential and advanced concepts of the framework.</p>
          </div>
          <div className="thtrm-layout thtrm-layout-thirds">
            <div className="thtrm-card">
              <h4 className="thtrm-card__topic">Essentials</h4>
              <h3 className="thtrm-card__heading">Introduction</h3>
              <ul className="thtrm-card__list">
                <li>TypeScript Basics</li>
                <li>Angular Concepts</li>
                <li>Bootstrapping an app</li>
                <li>Displaying data</li>
                <li>Using Directives</li>
              </ul>
            </div>
            <div className="thtrm-card">
              <h4 className="thtrm-card__topic">Essentials</h4>
              <h3 className="thtrm-card__heading">Introduction</h3>
              <ul className="thtrm-card__list">
                <li>TypeScript Basics</li>
                <li>Angular Concepts</li>
                <li>Bootstrapping an app</li>
                <li>Displaying data</li>
                <li>Using Directives</li>
              </ul>
            </div>
            <div className="thtrm-card">
              <h4 className="thtrm-card__topic">Essentials</h4>
              <h3 className="thtrm-card__heading">Introduction</h3>
              <ul className="thtrm-card__list">
                <li>TypeScript Basics</li>
                <li>Angular Concepts</li>
                <li>Bootstrapping an app</li>
                <li>Displaying data</li>
                <li>Using Directives</li>
              </ul>
            </div>
          </div>
          <div className="thtrm-section__footer">
            <p>The Online Course in the future will move you forward.</p>
            <a title="Sign in and learn Rust" href="#sign-in" className="u-distance-reset">Sign in and learn Rust</a>
          </div>
        </section>
        <section className="thtrm-section--fullbleed-intrinsic u-bg-lightgray">
          <div className="u-max-width--half">
            <div className="thtrm-section__header">
              <h2>FAQ</h2>
            </div>
            <h3 className="u-distance">You have problems with ...?</h3>
            <p className="u-color--grey">dasdasdasda dasd</p>
            <h3 className="u-distance">I am not sure that this course will be right for me as Backend-Developer</h3>
            <p className="u-color--grey">dasdasdas</p>
            <div className="thtrm-section__footer">
              <p>You have any questions?</p>
              <a href="mailto:pascal@thoughtram.io?subject=Question%20about%20Rust%20Online%20Course" className="u-distance-reset">Drop me a line</a>
            </div>
          </div>
        </section>
        <section className="thtrm-section u-distance-bottom-reset">
          <h2 className="">Articles about Rust in our Blog.</h2>
          <section className="thtrm-section--fullbleed-intrinsic">
            <div className="thtrm-layout thtrm-layout-thirds">
              <Teaser post={posts[1]}/>
              <Teaser post={posts[2]}/>
              <Teaser post={posts[3]}/>
            </div>
          </section>
        </section>
      </Layout>
    )
  }
}

export default Landingpage

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
