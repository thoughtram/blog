import React from "react"

class RustSignUp extends React.Component {
  render() {
    return (
      <div className="thtrm-section__hero">
        <div className="thtrm-section__hero-image">
          <img src="https://www.rust-lang.org/static/images/rust-logo-blk.svg" alt=""/>
        </div>
        <h2 className="thtrm-section__heading">Rust For JavaScript Developers</h2>
        <p className="thtrm-section__paragraph">Because learning Rust with a JavaScript background <strong>doesn't</strong> have to be hard.</p>
        <form action="" className="thtrm-form u-distance-medium" id="sign-in">
          <div className="thtrm-form__row thtrm-form__column-group">
            <input type="text" nane="firstname" className="thtrm-form__input--text" placeholder="Your firstname" />
            <input type="mail" name="mail" className="thtrm-form__input--text" placeholder="Your email" />
          </div>
          <div className="thtrm-form__row">
            <button type="submit" className="thtrm-button">Help me learn Rust!</button>
          </div>
          <h4 className="thtrm-section__heading">So you want to learn Rust?</h4>
          <p className="thtrm-section__paragraph thtrm-section__paragraph--small u-distance">
            I started learning Rust out of curiosity with zero experience in systems programming. I know the pain. With <i>Rust for JavaScript Developers</i> I'm creating an online resource with free content about the Rust programming language, primarily (but not only) aimed at developers with a strong JavaScript background.
</p>
          <p className="thtrm-section__paragraph thtrm-section__paragraph--small u-distance">- <a href="https://twitter.com/PascalPrecht" title="Pascal on Twitter">@PascalPrecht</a></p>
        </form>
      </div>
    )
  }
}

export default RustSignUp

