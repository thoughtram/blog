import React from "react"
import logo from '../assets/images/logo.svg';

class Header extends React.Component {

  constructor() {
    super();
    this.menu = React.createRef();
    this.navToggle = React.createRef();
  }

  toggleNav(btn) {
    const isVisible = btn.getAttribute('aria-expanded') === 'true' ? 'false' : 'true';

    btn.setAttribute(
      'aria-expanded',
      `${isVisible}`
    );
    this.menu.current.classList.toggle('is-visible');
    return isVisible;
  }

  hideNav() {
    this.navToggle.current.setAttribute(
      'aria-expanded', 'false'
    );
    this.menu.current.classList.remove('is-visible');
  };

  handleMenuClick(ev) {
    const isVisible = this.toggleNav(ev.currentTarget);
    if (isVisible === 'true') {
      document.body.addEventListener('click', () => {
        this.hideNav();
      }, {once: true});
    } else {
      document.body.removeEventListener('click', () => {
        this.hideNav(0);
      });
    }
  }

  render() {
    const menu = this.menu;
    const navToggle = this.navToggle;
    return (
      <header className="thtrm-banner" role="banner">
        <a href="https://thoughtram.io" title="Home"><img src={logo}
            alt="thoughtram"
            className="thtrm-logo"
            title="The thoughtram logo"/></a>
        <nav id="thtrm-nav-main"
            className="thtrm-nav"
            role="navigation"
            itemScope
            itemType="http://www.schema.org/SiteNavigationElement">
          <button className="thtrm-button--ghost thtrm-nav__button"
                  onClick={(e) => this.handleMenuClick(e)}
                  id="thtrm-nav-button"
                  ref={navToggle}
                  aria-expanded="false"
                  aria-label="Menu"
                  aria-controls="thtrm-nav-main-list">
                  <span aria-hidden="true">
                      Menu
                      <svg className="thtrm-icon"><use xlinkHref="#icon--chevron-down"/></svg>
                  </span>
          </button>
          <ul id="thtrm-nav-main-list" ref={menu} className="thtrm-nav__list">
            <li><a title="Training" href="https://thoughtram.io/training.html">Training</a></li>
            <li><a title="Consulting" href="https://thoughtram.io/code-review.html">Consulting</a></li>
            <li><a className="active" title="Blog" href="/">Blog</a></li>
          </ul>
        </nav>
      </header>
    )
  }
}

export default Header
