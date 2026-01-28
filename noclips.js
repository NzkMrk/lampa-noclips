/**
 * Lampa Diagnostic Plugin (safe)
 * Мета: перевірити, чи плагін завантажується і які API доступні.
 * Важливо: цей файл НЕ вирішує проблему завантаження з URL.
 * Якщо Lampa не може скачати файл — цей код навіть не запуститься.
 */
(function () {
  'use strict';

  var PLUGIN_ID = 'diag_lampa_safe';
  var STORAGE_KEY = 'diag_lampa_last';

  function now() {
    try { return new Date().toISOString(); } catch (e) { return '' + Date.now(); }
  }

  function safeLog() {
    try {
      if (typeof console !== 'undefined' && console.log) {
        console.log.apply(console, ['[DiagLampa]'].concat([].slice.call(arguments)));
      }
    } catch (e) {}
  }

  function has(obj, key) {
    try { return !!(obj && obj[key]); } catch (e) { return false; }
  }

  // Невеликий оверлей на екрані, щоб бачити результат без DevTools
  function overlay() {
    try {
      var el = document.getElementById('diag_lampa_overlay');
      if (el) return el;

      el = document.createElement('div');
      el.id = 'diag_lampa_overlay';
      el.style.position = 'fixed';
      el.style.right = '12px';
      el.style.bottom = '12px';
      el.style.zIndex = '999999';
      el.style.maxWidth = '45vw';
      el.style.maxHeight = '45vh';
      el.style.overflow = 'auto';
      el.style.padding = '10px 12px';
      el.style.borderRadius = '10px';
      el.style.background = 'rgba(0,0,0,0.75)';
      el.style.color = '#fff';
      el.style.fontSize = '12px';
      el.style.lineHeight = '1.35';
      el.style.fontFamily = 'monospace';
      el.style.whiteSpace = 'pre-wrap';
      el.style.userSelect = 'text';

      el.textContent = 'DiagLampa overlay\n';
      (document.body || document.documentElement).appendChild(el);
      return el;
    } catch (e) {
      return null;
    }
  }

  function write(line) {
    try {
      safeLog(line);
      var o = overlay();
      if (o) o.textContent += line + '\n';
    } catch (e) {}
  }

  function safeNoty(msg) {
    try {
      if (window.Lampa && Lampa.Noty && typeof Lampa.Noty.show === 'function') {
        Lampa.Noty.show(msg);
      }
    } catch (e) {}
  }

  function testApis() {
    try {
      write('--- API CHECK @ ' + now() + ' ---');

      write('window.Lampa: ' + (!!window.Lampa));
      if (!window.Lampa) {
        write('Lampa not found -> plugin running outside Lampa or слишком рано.');
        return;
      }

      write('Lampa.Plugin.create: ' + (has(Lampa, 'Plugin') && has(Lampa.Plugin, 'create')));
      write('Lampa.Listener.follow: ' + (has(Lampa, 'Listener') && has(Lampa.Listener, 'follow')));
      write('Lampa.Storage.get/set: ' + (has(Lampa, 'Storage') && has(Lampa.Storage, 'get') && has(Lampa.Storage, 'set')));
      write('Lampa.Activity.push: ' + (has(Lampa, 'Activity') && has(Lampa.Activity, 'push')));
      write('Lampa.Component.add: ' + (has(Lampa, 'Component') && has(Lampa.Component, 'add')));
      write('Lampa.Noty.show: ' + (has(Lampa, 'Noty') && has(Lampa.Noty, 'show')));

      // Storage test
      try {
        if (Lampa.Storage && typeof Lampa.Storage.set === 'function') {
          Lampa.Storage.set(STORAGE_KEY, { time: Date.now(), ok: true });
          write('Storage write: OK');
        } else {
          write('Storage write: SKIP (no API)');
        }
      } catch (e1) {
        write('Storage write: ERROR -> ' + (e1 && e1.message ? e1.message : e1));
      }

      safeNoty('DiagLampa: плагін запустився');
    } catch (e) {
      write('testApis fatal error: ' + (e && e.message ? e.message : e));
    }
  }

  function attachListeners() {
    try {
      if (!window.Lampa || !Lampa.Listener || typeof Lampa.Listener.follow !== 'function') {
        write('Listener.follow not available -> skip event hooks');
        return;
      }

      // app ready
      try {
        Lampa.Listener.follow('app', function (e) {
          try {
            if (e && e.type) write('[event app] type=' + e.type + ' @ ' + now());
          } catch (err) {}
        });
        write('Hooked Listener.follow("app")');
      } catch (e1) {
        write('Hook app error: ' + (e1 && e1.message ? e1.message : e1));
      }

      // full complite (як у твоєму прикладі з трейлерами)
      try {
        Lampa.Listener.follow('full', function (e) {
          try {
            if (e && e.type) write('[event full] type=' + e.type + ' @ ' + now());
          } catch (err) {}
        });
        write('Hooked Listener.follow("full")');
      } catch (e2) {
        write('Hook full error: ' + (e2 && e2.message ? e2.message : e2));
      }
    } catch (e) {
      write('attachListeners fatal error: ' + (e && e.message ? e.message : e));
    }
  }

  function boot() {
    try {
      write('DiagLampa boot @ ' + now());
      testApis();
      attachListeners();
      write('DiagLampa ready.');
    } catch (e) {
      write('boot fatal: ' + (e && e.message ? e.message : e));
    }
  }

  function init() {
    try {
      // Якщо немає Lampa.Plugin.create — не проблема, просто стартуємо
      if (!window.Lampa || !Lampa.Plugin || typeof Lampa.Plugin.create !== 'function') {
        write('No Plugin.create -> fallback init');
        setTimeout(boot, 0);
        return;
      }

      Lampa.Plugin.create({
        title: 'DiagLampa Safe',
        id: PLUGIN_ID,
        description: 'Діагностика завантаження плагінів та доступності API',
        version: '1.0.0',
        run: function () {
          try {
            // Деякі збірки мають appready
            if (window.appready) {
              boot();
              return;
            }

            // Чекаємо app ready якщо можливо
            if (Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
              Lampa.Listener.follow('app', function (e) {
                try {
                  if (e && e.type === 'ready') boot();
                } catch (err) {}
              });
            } else {
              boot();
            }
          } catch (e) {
            setTimeout(boot, 0);
          }
        }
      });

      write('Plugin registered: ' + PLUGIN_ID);
    } catch (e) {
      // Гарантовано не валимо запуск
      setTimeout(function () {
        try { boot(); } catch (e2) {}
      }, 0);
    }
  }

  init();
})();
