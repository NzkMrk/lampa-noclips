/**
 * Lampa TV plugin: No Shorts / No Clips
 * Мета: прибрати нову функцію "нарізки/shorts" (UI + блокування відкриття відповідних активностей)
 *
 * Вимоги:
 * - один .js файл
 * - чистий JS (ES5/ES6), без require/import/npm
 * - не ламає запуск навіть якщо Lampa / частина API недоступні
 */
(function () {
  'use strict';

  var PLUGIN_ID = 'no_shorts';
  var STORAGE_KEY_ENABLED = 'no_shorts_enabled';
  var STORAGE_KEY_LOADED_AT = 'no_shorts_loaded_at';

  // Слова/мітки, за якими будемо впізнавати "нарізки/shorts" у UI та в Activity.push
  var BLOCK_WORDS = [
    'shorts', 'short',
    'clips', 'clip',
    'нарізки', 'нарезки',
    'кліпи', 'клипы',
    'короткі', 'короткие'
  ];

  // Компоненти/ідентифікатори (на різних збірках може називатися по-різному)
  var BLOCK_COMPONENT_HINTS = [
    'short', 'shorts',
    'clip', 'clips',
    'reels'
  ];

  // Простий safe-log (щоб не падати, якщо console відсутній/урізаний)
  function log() {
    try {
      if (typeof console !== 'undefined' && console.log) {
        console.log.apply(console, ['[NoShorts]'].concat([].slice.call(arguments)));
      }
    } catch (e) {}
  }

  function safeLower(s) {
    try {
      return String(s || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function containsAny(haystack, needles) {
    var hs = safeLower(haystack);
    for (var i = 0; i < needles.length; i++) {
      if (hs.indexOf(needles[i]) !== -1) return true;
    }
    return false;
  }

  function isEnabled() {
    try {
      if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') {
        // за замовчуванням УВІМКНЕНО (true)
        var val = Lampa.Storage.get(STORAGE_KEY_ENABLED, true);
        return val !== false; // щоб "0"/null не ламали логіку
      }
    } catch (e) {}
    return true;
  }

  function markLoaded() {
    try {
      if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.set === 'function') {
        Lampa.Storage.set(STORAGE_KEY_LOADED_AT, Date.now());
      }
    } catch (e) {}
  }

  /**
   * 1) Блокуємо відкриття shorts/clips на рівні Activity.push
   *    (найнадійніше, бо навіть якщо кнопка десь залишилась — вона не відкриє "нарізки")
   */
  function patchActivityPush() {
    try {
      if (!window.Lampa || !Lampa.Activity) return;

      var act = Lampa.Activity;

      if (act.__no_shorts_patched) return;
      act.__no_shorts_patched = true;

      var originalPush = act.push;

      if (typeof originalPush !== 'function') return;

      act.push = function (params) {
        try {
          if (!isEnabled()) return originalPush.apply(this, arguments);

          var p = params || {};
          // Перевіряємо component/title/url
          var comp = safeLower(p.component);
          var title = safeLower(p.title);
          var url = safeLower(p.url);

          var looksLikeShorts =
            containsAny(comp, BLOCK_COMPONENT_HINTS) ||
            containsAny(title, BLOCK_WORDS) ||
            containsAny(url, BLOCK_WORDS);

          if (looksLikeShorts) {
            log('Blocked Activity.push:', p);

            // Якщо є нотифікації — покажемо коротке повідомлення (але не залежимо від нього)
            try {
              if (Lampa.Noty && typeof Lampa.Noty.show === 'function') {
                Lampa.Noty.show('Shorts/нарізки вимкнені плагіном');
              }
            } catch (e2) {}

            // Не відкриваємо активність
            return;
          }
        } catch (e) {
          // Якщо щось пішло не так — НЕ ламаємо навігацію, а пропускаємо
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
   * 2) Прибираємо пункти меню / кнопки, які ведуть на "нарізки/shorts"
   *    Робимо це максимально обережно (тільки якщо знаходимо елементи з відповідним текстом).
   */
  function removeShortsFromUIOnce() {
    try {
      if (!isEnabled()) return;

      // Основні місця, де зазвичай живуть пункти меню/каталогу
      var candidates = document.querySelectorAll(
        '.menu__item, .menu__list li, .head__action, .tabs__item, button, a, div'
      );

      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        if (!el || !el.parentNode) continue;

        // Відсікаємо великі контейнери, щоб випадково не видалити "пів сторінки"
        // (беремо лише відносно невеликі елементи за текстом)
        var text = safeLower(el.textContent);
        if (!text) continue;

        if (containsAny(text, BLOCK_WORDS)) {
          // Додаткова пересторога: якщо текст дуже великий — це, ймовірно, контейнер.
          if (text.length > 80) continue;

          // Можемо видаляти сам елемент, або його найближчий "пункт меню"
          var toRemove = el;

          // Якщо це текст усередині menu__item — краще прибрати весь пункт
          var parent = el.closest ? el.closest('.menu__item, li, .tabs__item') : null;
          if (parent) toRemove = parent;

          try {
            toRemove.parentNode.removeChild(toRemove);
            log('UI element removed (shorts/clips):', toRemove);
          } catch (e2) {}
        }
      }
    } catch (e) {
      log('removeShortsFromUIOnce error:', e);
    }
  }

  /**
   * 3) Спостерігач за DOM: якщо Lampa домальовує меню/кнопки — прибираємо знову.
   */
  function startUiObserver() {
    try {
      if (!isEnabled()) return;
      if (window.__no_shorts_observer_started) return;
      window.__no_shorts_observer_started = true;

      // Перший прохід
      removeShortsFromUIOnce();

      if (typeof MutationObserver === 'undefined') {
        // На дуже старих вебдвижках просто робимо періодичний "підчист"
        setInterval(removeShortsFromUIOnce, 2000);
        return;
      }

      var obs = new MutationObserver(function () {
        // легкий debounce через setTimeout
        try {
          clearTimeout(obs.__t);
          obs.__t = setTimeout(removeShortsFromUIOnce, 250);
        } catch (e) {}
      });

      obs.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
      });

      log('UI observer started');
    } catch (e) {
      log('startUiObserver error:', e);
    }
  }

  /**
   * 4) (Опційно) реєструємо "порожній" компонент, щоб:
   *    - виконати вимогу "використовуй Lampa.Component"
   *    - мати стабільну точку для діагностики (але ми НЕ додаємо його в меню)
   */
  function registerDummyComponent() {
    try {
      if (!window.Lampa || !Lampa.Component || typeof Lampa.Component.add !== 'function') return;

      if (Lampa.Component.__no_shorts_component_added) return;
      Lampa.Component.__no_shorts_component_added = true;

      Lampa.Component.add('no_shorts_dummy', function () {
        // Мінімальний "компонент-заглушка"
        var html = document.createElement('div');
        html.style.padding = '1.5em';
        html.innerHTML = '<h2>NoShorts</h2><div>Плагін активний. Shorts/нарізки блокуються.</div>';

        return {
          create: function () {},
          render: function () { return html; },
          destroy: function () {}
        };
      });

      log('Dummy component registered');
    } catch (e) {
      log('registerDummyComponent error:', e);
    }
  }

  /**
   * Головний запуск (безпечний)
   */
  function boot() {
    try {
      if (!window.Lampa) {
        // Lampa ще не піднялась або плагін відкрили як звичайний скрипт у браузері
        log('Lampa not found, plugin will stay idle.');
        return;
      }

      markLoaded();
      registerDummyComponent();
      patchActivityPush();
      startUiObserver();

      log('Plugin boot OK. enabled=', isEnabled());
    } catch (e) {
      // НІКОЛИ не валимо застосунок через плагін
      log('boot error:', e);
    }
  }

  /**
   * Правильна ініціалізація:
   * - якщо вже "appready" — стартуємо одразу
   * - інакше чекаємо Lampa.Listener.follow('app', {type:'ready'})
   */
  function initSafely() {
    try {
      // Плагін як "розширення" у Lampa зазвичай стартує так:
      // Lampa.Plugin.create({ run: fn })
      if (!window.Lampa || !Lampa.Plugin || typeof Lampa.Plugin.create !== 'function') {
        // Якщо Plugin API недоступне — все одно спробуємо стартанути після load
        log('Lampa.Plugin.create missing, fallback init');
        // невелика затримка, щоб дати Lampa шанс ініціалізуватись
        setTimeout(boot, 0);
        return;
      }

      Lampa.Plugin.create({
        title: 'No Shorts / No Clips',
        id: PLUGIN_ID,
        description: 'Вимикає нову функцію "нарізки/shorts" (прибирає UI та блокує відкриття).',
        version: '1.0.0',

        run: function () {
          try {
            // Деякі збірки мають window.appready
            if (window.appready) {
              boot();
              return;
            }

            // Чекаємо готовність застосунку
            if (Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
              Lampa.Listener.follow('app', function (e) {
                try {
                  if (e && e.type === 'ready') boot();
                } catch (err) {
                  log('Listener handler error:', err);
                }
              });
            } else {
              // якщо Listener недоступний — стартуємо одразу
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
      log('initSafely error:', e);
      // крайній fallback
      try { boot(); } catch (e2) {}
    }
  }

  // Старт
  initSafely();
})();
