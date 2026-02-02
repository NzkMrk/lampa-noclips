(function () {
    'use strict';

    // 1. Компонент, який відкривається при натисканні на кнопку
    function UAOnline(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        
        this.create = function () {
            var query = object.search || (object.movie ? (object.movie.title || object.movie.name) : '');
            var html = $('<div style="padding: 2em; text-align: center;"><h1>UA Online</h1><p>Шукаємо: ' + query + '</p><div class="wait">Парсер у розробці...</div></div>');
            
            scroll.append(html);
            return scroll.render();
        };
    }

    function startPlugin() {
        // Реєстрація компонента
        Lampa.Component.add('ua_online', UAOnline);

        // Функція додавання кнопки в картку
        var addBtn = function(e) {
            if ($('.full-start__buttons .view--ua-online').length > 0) return;

            var btn = $('<div class="full-start__button selector view--ua-online" style="background: #24b353 !important; color: #fff !important; border-radius: 5px; margin-right: 10px;"><svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" style="fill: white; vertical-align: middle; margin-right: 8px;"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg><span>UA Online</span></div>');

            btn.on('hover:enter', function () {
                Lampa.Activity.push({
                    title: 'UA Online',
                    component: 'ua_online',
                    movie: e.data.movie
                });
            });

            // Додаємо кнопку в початок списку
            $('.full-start__buttons').prepend(btn);
        };

        // Слухаємо подію завершення завантаження картки
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                setTimeout(function() { addBtn(e); }, 10);
            }
        });
    }

    // Запуск
    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }
})();
