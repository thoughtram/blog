import React from "react"

class Card extends React.Component {
  render() {
    const { post } = this.props;
    return (
      <div className="thtrm-card thtrm-card--white">
        <h4 className="thtrm-card__topic thtrm-card__topic--grey">{post.node.frontmatter.categories[0]}</h4>
        <h3 className="thtrm-card__heading">{post.node.frontmatter.title}</h3>
        <p className="thtrm-card__paragraph">{post.node.frontmatter.summary}</p>
        <Link className="thtrm-section__link" to={post.node.fields.slug}>Read more</Link>
      </div>
    )
  }
}

export default Card

