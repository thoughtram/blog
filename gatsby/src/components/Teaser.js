import React from "react"
import { Link } from "gatsby"

class Teaser extends React.Component {
  render() {
    const { post } = this.props;
    return (
      <div className="thtrm-teaser">
        <h4 className="thtrm-topic thtrm-teaser__topic u-color--grey">{post.node.frontmatter.categories[0]}</h4>
        <h3 className="thtrm-teaser__title thtrm-title">{post.node.frontmatter.title}</h3>
        <img src="https://blog.thoughtram.io//images/banner/easy-dialogs-with-angular-material.jpg" alt="" className="thtrm-teaser__thumb" />
        <p className="thtrm-teaser__paragraph u-text--small u-color--grey">{post.node.frontmatter.summary}</p>
        <Link className="thtrm-teaser__link u-text--small" to={post.node.fields.slug}>Read more</Link>
      </div>
    )
  }
}

export default Teaser

