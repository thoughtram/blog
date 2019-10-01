import React from "react"
import { Link } from "gatsby"

class SubNav extends React.Component {
  render() {
    return (
      <nav className="thtrm-nav-toc">
        <ul>
          <li><Link to="/categories/angular" activeClassName="is-active">Angular</Link></li>
          <li><Link to="/categories/rxjs" activeClassName="is-active">Rx</Link></li>
          <li><Link to="/categories/rust" activeClassName="is-active">Rust</Link></li>
          <li><Link to="/categories/git" activeClassName="is-active">Git</Link></li>
          <li><Link to="/categories/announcements" activeClassName="is-active">Announcements</Link></li>
        </ul>
      </nav>
    )
  }
}

export default SubNav
