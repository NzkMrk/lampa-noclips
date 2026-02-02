(function () {
    'use strict';

    function startPlugin() {
        // 1. Виводимо повідомлення в кутку екрана
        Lampa.Noty.show('Тестовий плагін активовано!');

        // 2. Додаємо пункт у головне меню
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                var menu_item = {
                    title: 'Тест UAkino',
                    icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white"/></svg>',
                    id: 'test_ua_plugin'
                };

                // Додаємо в список меню
                Lampa.Menu.add(menu_item);
            }
        });

        // 3. Обробка натискання на цей пункт
        Lampa.Component.add('test_ua_component', function (object) {
            var comp = new Lampa.Interaction();
            
            comp.create = function () {
                return '<div><h1 style="padding: 20px;">Вітаю! Плагін працює.</h1></div>';
            };
            
            return comp;
        });
    }

    // Реєстрація плагіна
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }
})();
