import React from "react"
import { Link } from "gatsby"
import { upperCaseFirst } from '../utils/uppercase-first';

class ListingItem extends React.Component {
  render() {
    const { post } = this.props;
    return (
      <Link to={post.fields.slug} className="thtrm-raw-link thtrm-teaser thtrm-teaser--row thtrm-listing__item">
        <div>
          <div className="u-flex">
            <time dateTime={post.frontmatter.date} className="thtrm-topic u-color--grey">{post.frontmatter.date}</time>
            { post.frontmatter.categories && <p className="thtrm-topic u-color--grey">&nbsp; / {upperCaseFirst(post.frontmatter.categories[0])}</p>}
          </div>
          <h2 className="thtrm-title">{post.frontmatter.title}</h2>
        </div>
        <div className="thtrm-teaser__thumb">
          <img src={ "https://blog.thoughtram.io/" + post.frontmatter.imageUrl} alt="" />
        </div>
      </Link>
    );
  }
}

export default ListingItem;
