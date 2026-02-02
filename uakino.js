(function () {
    'use strict';

    // Функція, яка додає наше джерело в кнопку "Дивитися"
    function startPlugin() {
        // 1. Спливаюче повідомлення (якщо його побачиш - плагін завантажився!)
        Lampa.Noty.show('UA Online: ПЛАГІН ПРАЦЮЄ');

        // 2. Реєструємо компонент пошуку
        Lampa.Component.add('ua_online', function(object) {
            var network = new Lampa.Reguest();
            var scroll  = new Lampa.Scroll({mask: true, over: true});
            
            this.create = function () {
                var query = object.search || (object.movie ? (object.movie.title || object.movie.name) : '');
                scroll.append($('<div style="padding: 2em; text-align: center;">Пошук для: ' + query + '</div>'));
                return scroll.render();
            };
        });

        // 3. Інтеграція в меню "Онлайн"
        Lampa.Listener.follow('online', function (e) {
            if (e.type == 'start') {
                e.sources.push({
                    title: 'UA Online',
                    name: 'ua_online',
                    onSelect: function() {
                        Lampa.Activity.push({
                            title: 'UA Online',
                            component: 'ua_online',
                            movie: e.movie
                        });
                    }
                });
            }
        });
    }

    // Запуск
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') startPlugin();
    });
})();
