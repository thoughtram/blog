import React from "react"
import SEO from "./seo"
import Header from './Header';
import Footer from './Footer';

class Layout extends React.Component {
  render() {
    const { title, children } = this.props
    return (
      <div className="thtrm-page">
        <SEO title={title} />
        <Header/>
        <main className="thtrm-main" role="main">
          {children}
        </main>

        <aside className="thtrm-aside" role="complementary">
          <section className="thtrm-section--centered thtrm-section--unpadded-bottom u-flex--justify-center">
            <h1 className="thtrm-section__heading--small">Get notified about upcoming  classes and news</h1>
            <form className="thtrm-form"
                  action="//thoughtram.us8.list-manage.com/subscribe/post?u=dfbb1507fbced5a20d9dc5698&amp;id=731f22cdca"
                  method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" target="_blank" novalidate>
              <label className="thtrm-form__label" for="thtrm-newsletter" aria-hidden="true">Your email</label> <input type="email"
                                                                                                                  className="thtrm-form__input--text"
                                                                                                                  id="thtrm-newsletter"
                                                                                                                  value=""
                                                                                                                  name="EMAIL"
                                                                                                                  placeholder="Your email address..."
                                                                                                                  required/>
              <div className="u-offscreen-text">
                <label className="thtrm-form__label" for="thtrm-newsletter-text" aria-hidden="true">Your email</label> <input
                id="thtrm-newsletter-text" placeholder="Your email …" name="b_dfbb1507fbced5a20d9dc5698_731f22cdca"
                tabindex="-1"
                value=""/>
              </div>
              <input type="submit" value="Notify me" name="subscribe" className="thtrm-form__button thtrm-button"
                    aria-label="Notify me"/>
              <p className="thtrm-form__info-text">Information on the performance measurement included in the consent, the use of the mail service provider MailChimp and on the logging of the registration and your rights of revocation can be found in our <a href="https://thoughtram.io/imprint.html" title="Privacy Statement">data protection declaration</a>.</p>
            </form>
          </section>
        </aside>
        <Footer/>
      </div>
    )
  }
}

export default Layout
