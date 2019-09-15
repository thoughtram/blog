import React from "react"
import { Link } from "gatsby"

class Stage extends React.Component {
  render() {
    const { post } = this.props;
    return (
      <section className="thtrm-section u-flex--nowrap">
        <div className="thtrm-section__item--halfpadded">
          <Link to={post.fields.slug} className="thtrm-section__link thtrm-section__link--black">
            <p className="thtrm-section__heading thtrm-topic u-color--grey u-distance-bottom-reset">{post.frontmatter.categories[0]}</p>
            <h1>{post.frontmatter.title}</h1>
            <p className="thtrm-section__paragraph u-color--grey">{post.frontmatter.summary}</p>
            <span className="thtrm-section__link">Read more</span>
          </Link>
        </div>
        <div className="thtrm-section__item--flushright">
          <div className="thtrm-section__image thtrm-ratio--landscape">
            <img src={ "https://blog.thoughtram.io/" + post.frontmatter.imageUrl}
                srcSet={ "https://blog.thoughtram.io/" + post.frontmatter.imageUrl + ' 600w'}
                sizes="(min-width: 700px) 40vw, 90vw"
                alt="Cover"/>
          </div>
        </div>
      </section>
    )
  }
}

export default Stage

