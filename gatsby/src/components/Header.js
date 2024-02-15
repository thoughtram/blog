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
      </header>
    )
  }
}

export default Header
