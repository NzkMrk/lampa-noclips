(function () {
  'use strict';

  function start() {
    if (!window.Lampa) return setTimeout(start, 300);

    if (Lampa.Clips) {
      // повністю блокуємо кліпи
      Lampa.Clips.open = function(){};
      Lampa.Clips.render = function(){};
      Lampa.Clips.show = function(){ return false; };
    }

    console.log('[NoClips] Clips disabled');
  }

  start();
})();
