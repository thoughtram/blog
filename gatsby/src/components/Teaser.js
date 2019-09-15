import React from "react"
import { Link } from "gatsby"
import { upperCaseFirst } from '../utils/uppercase-first';

class Teaser extends React.Component {
  render() {
    const { post } = this.props;
    return (
      <div className="thtrm-teaser">
        {post.node.frontmatter.categories && <h4 className="thtrm-topic thtrm-teaser__topic u-color--grey">{upperCaseFirst(post.node.frontmatter.categories[0])}</h4>}
        <h3 className="thtrm-teaser__title thtrm-title">{post.node.frontmatter.title}</h3>
        <img src={ "https://blog.thoughtram.io/" + post.node.frontmatter.imageUrl} alt="" className="thtrm-teaser__thumb" />
        <p className="thtrm-teaser__paragraph u-text--small u-color--grey">{post.node.frontmatter.summary}</p>
        <Link className="thtrm-teaser__link u-text--small" to={post.node.fields.slug}>Read more</Link>
      </div>
    )
  }
}

export default Teaser

