(function () {
  'use strict';

  var PLUGIN_ID = 'hide_clips_choice';
  var STORAGE_ENABLED = 'hide_clips_choice_enabled';
  var STORAGE_LOADED_AT = 'hide_clips_choice_loaded_at';

  // Ключові слова/мітки (на різних мовах і збірках)
  var WORDS = [
    'clips', 'clip',
    'shorts', 'short',
    'нарізки', 'нарезки',
    'кліпи', 'клипы'
  ];

  // Натяки по component/url (якщо Lampa запускає окрему активність)
  var COMPONENT_HINTS = [
    'clip', 'clips',
    'short', 'shorts',
    'reels'
  ];

  function log() {
    try {
      if (typeof console !== 'undefined' && console.log) {
        console.log.apply(console, ['[HideClips]'].concat([].slice.call(arguments)));
      }
    } catch (e) {}
  }

  function lower(x) {
    try { return String(x || '').toLowerCase(); } catch (e) { return ''; }
  }

  function containsAny(text, list) {
    var t = lower(text);
    for (var i = 0; i < list.length; i++) {
      if (t.indexOf(list[i]) !== -1) return true;
    }
    return false;
  }

  function enabled() {
    try {
      if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') {
        var v = Lampa.Storage.get(STORAGE_ENABLED, true);
        return v !== false;
      }
    } catch (e) {}
    return true;
  }

  function markLoaded() {
    try {
      if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.set === 'function') {
        Lampa.Storage.set(STORAGE_LOADED_AT, Date.now());
      }
    } catch (e) {}
  }

  /**
   * 1) Блокуємо відкриття Clips/Shorts через Activity.push
   * Це корисно саме для твого кейсу №4: навіть якщо пункт “clips” десь є,
   * він не відкриється.
   */
  function patchActivityPush() {
    try {
      if (!window.Lampa || !Lampa.Activity) return;

      var A = Lampa.Activity;
      if (A.__hide_clips_patched) return;
      A.__hide_clips_patched = true;

      var originalPush = A.push;
      if (typeof originalPush !== 'function') return;

      A.push = function (params) {
        try {
          if (!enabled()) return originalPush.apply(this, arguments);

          var p = params || {};
          var comp = lower(p.component);
          var title = lower(p.title);
          var url = lower(p.url);

          var looksLikeClips =
            containsAny(comp, COMPONENT_HINTS) ||
            containsAny(title, WORDS) ||
            containsAny(url, WORDS);

          if (looksLikeClips) {
            log('Blocked Activity.push:', p);

            // М’яке повідомлення, якщо Noty є
            try {
              if (Lampa.Noty && typeof Lampa.Noty.show === 'function') {
                Lampa.Noty.show('Clips/Shorts вимкнені');
              }
            } catch (e2) {}

            return; // блокуємо
          }
        } catch (e) {
          // якщо зламалась перевірка — не ламаємо навігацію
          log('push check error:', e);
        }

        return originalPush.apply(this, arguments);
      };

      log('Activity.push patched');
    } catch (e) {
      log('patchActivityPush error:', e);
    }
  }

  /**
   * 2) Прибираємо пункт "clips" саме з меню/діалогу вибору "Дивитись".
   *
   * У Lampa це часто виглядає як невелике меню/лист з елементами (div/li/button/a).
   * Ми не прив’язуємось до точних класів (бо вони різні у збірках),
   * а шукаємо "маленькі" клікабельні елементи з текстом clips/shorts/нарізки.
   */
  function removeClipsChoiceFromDom() {
    try {
      if (!enabled()) return;

      // Кандидати: типові кнопки/пункти списку/меню/діалогу
      var nodes = document.querySelectorAll('button, a, li, .selector, .selectbox__item, .menu__item, .item, div');

      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!el || !el.parentNode) continue;

        // Текст
        var text = lower(el.textContent);
        if (!text) continue;

        // Відсікаємо великі контейнери
        if (text.length > 60) continue;

        // Має збігатися саме як "пункт": clips/shorts/нарізки
        if (!containsAny(text, WORDS)) continue;

        // Додаткова перевірка: елемент має виглядати клікабельним
        var tag = (el.tagName || '').toUpperCase();
        var clickable = (tag === 'BUTTON' || tag === 'A' || tag === 'LI');

        // Якщо це DIV, перевіримо атрибути/роль або курсор
        if (!clickable) {
          var role = lower(el.getAttribute && el.getAttribute('role'));
          if (role === 'button' || role === 'menuitem') clickable = true;

          // або має onclick
          if (!clickable && typeof el.onclick === 'function') clickable = true;
        }

        if (!clickable) continue;

        // Інколи текст “clips” є всередині кнопки — краще прибрати найближчий “пункт”
        var toRemove = el;
        try {
          if (el.closest) {
            var parentItem = el.closest('button, a, li, .selectbox__item, .menu__item');
            if (parentItem) toRemove = parentItem;
          }
        } catch (e2) {}

        try {
          toRemove.parentNode.removeChild(toRemove);
          log('Removed clips choice item:', text);
        } catch (e3) {}
      }
    } catch (e) {
      log('removeClipsChoiceFromDom error:', e);
    }
  }

  /**
   * 3) DOM-спостерігач: меню вибору "Дивитись" з’являється після кліку,
   * тому чистимо не один раз, а щоразу коли DOM змінюється.
   */
  function startObserver() {
    try {
      if (!enabled()) return;

      // Перший прохід
      removeClipsChoiceFromDom();

      // Якщо MutationObserver відсутній — fallback на таймер
      if (typeof MutationObserver === 'undefined') {
        setInterval(removeClipsChoiceFromDom, 800);
        log('Observer fallback: interval');
        return;
      }

      if (window.__hide_clips_observer_started) return;
      window.__hide_clips_observer_started = true;

      var obs = new MutationObserver(function () {
        try {
          clearTimeout(obs.__t);
          obs.__t = setTimeout(removeClipsChoiceFromDom, 120);
        } catch (e) {}
      });

      obs.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
      });

      log('DOM observer started');
    } catch (e) {
      log('startObserver error:', e);
    }
  }

  /**
   * (Опційно) маленька діагностика через Component — не додаємо в меню,
   * просто реєструємо, щоб було видно, що плагін “живий” у деяких збірках.
   */
  function registerDummyComponent() {
    try {
      if (!window.Lampa || !Lampa.Component || typeof Lampa.Component.add !== 'function') return;
      if (Lampa.Component.__hide_clips_dummy_added) return;
      Lampa.Component.__hide_clips_dummy_added = true;

      Lampa.Component.add('hide_clips_dummy', function () {
        var box = document.createElement('div');
        box.style.padding = '1.2em';
        box.innerHTML = '<div style="font-size:1.2em;margin-bottom:.5em">HideClips</div>' +
          '<div>Плагін активний: пункт Clips прибирається з вибору “Дивитись”.</div>';
        return {
          create: function () {},
          render: function () { return box; },
          destroy: function () {}
        };
      });

      log('Dummy component registered');
    } catch (e) {
      log('registerDummyComponent error:', e);
    }
  }

  function boot() {
    try {
      if (!window.Lampa) {
        log('Lampa not found, idle.');
        return;
      }

      markLoaded();
      registerDummyComponent();
      patchActivityPush();
      startObserver();

      log('Boot OK. enabled=', enabled());
    } catch (e) {
      log('boot error:', e);
    }
  }

  /**
   * Нормальна ініціалізація через Lampa.Plugin.create + очікування ready,
   * але якщо цього API немає — все одно стартуємо без падіння.
   */
  function init() {
    try {
      if (!window.Lampa || !Lampa.Plugin || typeof Lampa.Plugin.create !== 'function') {
        log('Plugin API missing, fallback boot');
        setTimeout(boot, 0);
        return;
      }

      Lampa.Plugin.create({
        title: 'Hide Clips in Watch',
        id: PLUGIN_ID,
        description: 'Прибирає пункт clips/shorts/нарізки з вибору при натисканні “Дивитись” + блокує відкриття.',
        version: '1.0.0',
        run: function () {
          try {
            if (window.appready) {
              boot();
              return;
            }

            if (Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
              Lampa.Listener.follow('app', function (e) {
                try {
                  if (e && e.type === 'ready') boot();
                } catch (err) {
                  log('Listener error:', err);
                }
              });
            } else {
              boot();
            }
          } catch (e) {
            log('run error:', e);
            boot();
          }
        }
      });

      log('Plugin registered:', PLUGIN_ID);
    } catch (e) {
      log('init error:', e);
      try { boot(); } catch (e2) {}
    }
  }

  init();
})();
