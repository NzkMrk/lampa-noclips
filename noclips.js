(function () {
  'use strict';

  let disabled = false;

  function disableClips() {
    try {
      if (!window.Lampa) return;
      if (!Lampa.Clips) return;
      if (disabled) return;

      // глушимо логіку кліпів
      ['open', 'render', 'show', 'start'].forEach(fn => {
        if (typeof Lampa.Clips[fn] === 'function') {
          Lampa.Clips[fn] = function(){};
        }
      });

      // якщо Lampa очікує boolean
      if (typeof Lampa.Clips.show === 'function') {
        Lampa.Clips.show = function(){ return false; };
      }

      disabled = true;
      console.log('[NoClips] Clips disabled (stable)');
    } catch (e) {
      console.log('[NoClips] error ignored');
    }
  }

  // слухаємо життєвий цикл Lampa
  document.addEventListener('lampa:ready', disableClips);
  document.addEventListener('lampa:start', disableClips);

  // fallback — якщо події не прийшли
  setInterval(disableClips, 1000);
})();
