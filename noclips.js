(function () {
  'use strict';

  function safe() {
    try {
      if (!window.Lampa || !Lampa.Clips) return;

      // блокуємо кліпи
      Lampa.Clips.open = function(){};
      Lampa.Clips.render = function(){};
      Lampa.Clips.show = function(){ return false; };

      console.log('[NoClips] OK');
      clearInterval(timer);
    } catch (e) {
      console.log('[NoClips] error', e);
    }
  }

  const timer = setInterval(safe, 500);
})();
