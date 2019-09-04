import React from "react"
import { Link } from "gatsby"

class SubNav extends React.Component {
  render() {
    return (
      <nav className="thtrm-nav-toc">
        <ul>
          <li><Link to="/categories/angular">Angular</Link></li>
          <li><Link to="/categories/rxjs">Rx</Link></li>
          <li><Link to="/categories/rust">Rust</Link></li>
          <li><Link to="/categories/git">Git</Link></li>
          <li><Link to="/categories/announcements">Announcements</Link></li>
        </ul>
      </nav>
    )
  }
}

export default SubNav
