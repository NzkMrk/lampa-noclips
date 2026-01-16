(function () {
  'use strict';

  const BAD_WORDS = [
    'clip',
    'short',
    'наріз',
    'shorts'
  ];

  function isBad(el) {
    const text = (el.innerText || '').toLowerCase();
    return BAD_WORDS.some(w => text.includes(w));
  }

  function removeClips() {
    try {
      // кнопки / плитки
      document.querySelectorAll('button, div, span, a').forEach(el => {
        if (isBad(el)) {
          el.remove();
        }
      });

      // блоки списків
      document.querySelectorAll('[class], [data-type]').forEach(el => {
        if (isBad(el)) {
          el.remove();
        }
      });
    } catch (e) {}
  }

  // постійний контроль (але легкий)
  setInterval(removeClips, 1000);
})();
