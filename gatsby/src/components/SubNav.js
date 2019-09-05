import React from "react"

class SubNav extends React.Component {
  render() {
    return (
      <nav className="thtrm-nav-toc">
        <ul>
          <li><a href="#section:training-courses">Rust</a></li>
          <li><a href="#section:training-courses">Angular</a></li>
          <li><a href="#section:training-courses">Git</a></li>
        </ul>
      </nav>
    )
  }
}

export default SubNav
