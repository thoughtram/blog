import React from "react"
import SEO from "./seo"
import Header from './Header';
import Footer from './Footer';
import SvgIcons from './SvgIcons';

class Layout extends React.Component {
  render() {
    const { title, children, description } = this.props
    return (
      <div className="thtrm-page">
        <SEO title={title} description={description}/>
        <Header/>
        <main className="thtrm-main" role="main">
          {children}
        </main>
        <Footer/>
        <SvgIcons/>
      </div>
    )
  }
}

export default Layout
