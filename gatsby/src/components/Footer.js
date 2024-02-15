import React from "react"

class Footer extends React.Component {
  render() {
    return (
      <footer className="thtrm-footer" role="contentinfo">
        <div className="thtrm-copyright">
          <p>© {new Date().getFullYear()} The thoughtram Blog Maintainers</p>
        </div>
      </footer>
    )
  }
}

export default Footer

