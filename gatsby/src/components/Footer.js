import React from "react"

class Footer extends React.Component {
  render() {
    return (
      <footer className="thtrm-footer" role="contentinfo">
        <section className="thtrm-sitemap">
          <div className="thtrm-sitemap__item">
            <h2 className="thtrm-sitemap__heading">Company</h2>
            <nav className="thtrm-sitemap__nav" role="navigation">
              <ul>
                <li><a title="Read our high quality articles" href="/">Blog</a></li>
                <li><a title="Learn more about thoughtram training" href="https://thoughtram.io/training.html">Training</a></li>
                <li><a title="Learm more about Angular Master Class" href="https://thoughtram.io/angular-master-class.html">Angular Master Class</a></li>
                <li><a title="Learn more about Git Master Class" href="https://thoughtram.io/git-master-class.html">Git Master Class</a></li>
                <li><a title="Learn more about RxJS Master Class" href="https://thoughtram.io/rxjs-master-class.html">RxJS Master Class</a></li>
                <li><a title="Learn more about Consulting and Code Review" href="https://thoughtram.io/code-review.html">Consulting and Code Review</a></li>
                <li><a title="Read our Code of conduct" href="https://thoughtram.io/code-of-conduct.html">Code of Conduct</a></li>
              </ul>
            </nav>
          </div>
          <div className="thtrm-sitemap__item">
            <h2 className="thtrm-sitemap__heading">Community</h2>
            <nav className="thtrm-sitemap__nav" role="navigation">
              <ul>
                <li><a title="thoughtram on Twitter" href="https://twitter.com/thoughtram">Twitter</a></li>
                <li><a title="thoughtram on Facebook" href="https://facebook.com/thoughtram">Facebook</a></li>
                <li><a title="thoughtram on GitHub" href="https://github.com/thoughtram">Github</a></li>
              </ul>
            </nav>
          </div>
        </section>
        <div className="thtrm-copyright">
          <a href="https://thoughtram.io/imprint.html">Legal Notice</a>
          <p>© 2014-{new Date().getFullYear()} thoughtram GmbH</p>
        </div>
      </footer>
    )
  }
}

export default Footer

