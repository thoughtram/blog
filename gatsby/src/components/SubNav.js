import React from "react"
import { Link } from "gatsby"

class SubNav extends React.Component {
  render() {
    return (
      <nav className="thtrm-nav-toc">
        <ul>
          <li><Link to="/categories/rust">Rust</Link></li>
          <li><Link to="/cateogories/angular">Angular</Link></li>
          <li><Link to="/cateogries/git">Git</Link></li>
        </ul>
      </nav>
    )
  }
}

export default SubNav
