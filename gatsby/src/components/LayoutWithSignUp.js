import React from "react"
import SEO from "./seo"
import Header from './Header';
import SignUpForm from './SignUpForm';
import Footer from './Footer';
import SvgIcons from './SvgIcons';

class LayoutWithSignUp extends React.Component {
  render() {
    const { title, children } = this.props
    return (
      <div className="thtrm-page">
        <SEO title={title} />
        <Header/>
        <main className="thtrm-main" role="main">
          {children}
        </main>
        <aside className="thtrm-aside">
          <SignUpForm/>
        </aside>
        <Footer/>
        <SvgIcons/>
      </div>
    )
  }
}

export default LayoutWithSignUp

