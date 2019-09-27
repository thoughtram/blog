import React from "react"

class AdCard extends React.Component {
  render() {
    return (
      <div className="thtrm-card thtrm-section__heading">
        <div className="thtrm-media thtrm-media--top-start">
          <img src="https://www.rust-lang.org/static/images/rust-logo-blk.svg" alt="" className="thtrm-media__asset" />
          <div className="thtrm-media__body">
            <h2>Learn Rust the right way</h2>
            <p>Our Online Course is the best material for JS Developers.</p>
            <ul className="thtrm-card__list">
              <li>Introduction</li>
              <li>Architecture</li>
              <li>API</li>
            </ul>
            <span className="thtrm-button u-distance-small">Explore Course</span>
          </div>
        </div>
      </div>
    )
  }
}

export default AdCard
