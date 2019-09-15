import React from "react"

class SvgIcons extends React.Component {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" hidden>
        <symbol viewBox="0 0 24 24" id="icon--chevron-right">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          <path d="M0 0h24v24H0z" fill="none"/>
        </symbol>
        <symbol viewBox="0 0 24 24" id="icon--chevron-down">
          <path d="M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z"/>
          <path d="M0-.75h24v24H0z" fill="none"/>
        </symbol>
        <symbol viewBox="0 0 24 24" id="icon--menu">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          <path d="M0 0h24v24H0z" fill="none"/>
        </symbol>
      </svg>
    );
  }
}

export default SvgIcons
