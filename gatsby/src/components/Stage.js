import React from "react"
import { Link } from "gatsby"
import Img from 'gatsby-image'
import { upperCaseFirst } from '../utils/uppercase-first';

class Stage extends React.Component {
  render() {
    const { post } = this.props;
    return (
      <section className="thtrm-section u-flex--nowrap">
        <div className="thtrm-section__item--halfpadded">
          <Link to={post.fields.slug} className="thtrm-section__link thtrm-section__link--black">
            <p className="thtrm-section__heading thtrm-topic u-color--grey u-distance-bottom-reset">{upperCaseFirst(post.frontmatter.categories[0])}</p>
            <h1>{post.frontmatter.title}</h1>
            <p className="thtrm-section__paragraph u-color--grey">{post.frontmatter.summary}</p>
            <span className="thtrm-section__link">Read more</span>
          </Link>
        </div>
        {post.frontmatter.imageUrl && <div className="thtrm-section__item--flushright">
          <Img sizes={post.frontmatter.imageUrl.childImageSharp.sizes} className="thtrm-section__image thtrm-ratio--landscape"/>
        </div>}
      </section>
    )
  }
}

export default Stage
