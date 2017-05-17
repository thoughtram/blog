(function (doc, win) {
  'use strict';

  linkjuice.init('.thtrm-article', {
    selector: ['h2', 'h3'],
    icon: ''
  });

    var stickyElements = doc.querySelectorAll('.is-sticky');

    for (var i = stickyElements.length - 1; i >= 0; i--) {
      var el = stickyElements[i];

      if (el.classList.contains('thtrm-toc')) {
        el.classList.add('thtrm-toc--sticky');
        el.classList.add('thtrm-toc--faded');
      } 
      if (el.classList.contains('thtrm-ad')) {
        el.classList.add('thtrm-ad--sticky');
        el.classList.add('thtrm-ad--description');
      }
      Stickyfill.add(el);
    }
}(document, window));
