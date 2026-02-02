(function () {
    'use strict';

    function UAOnline(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        
        this.create = function () {
            var _this = this;
            var query = object.search || (object.movie ? (object.movie.title || object.movie.name) : '');
            
            // Створюємо порожній контейнер
            var html = $('<div><div class="wait" style="padding: 20px;">Пошук українською для: ' + query + '...</div></div>');
            
            // Додаємо в скролл
            scroll.append(html);
            
            // Тут буде логіка парсингу пізніше
            setTimeout(function(){
                html.find('.wait').text('Розділ у розробці (Пошук: ' + query + ')');
            }, 1500);

            return scroll.render();
        };
    }

    function startPlugin() {
        console.log('UAkino: Plugin started');

        // Функція додавання кнопки
        var addBtn = function(e) {
            if ($('.full-start__buttons .view--ua-online').length > 0) return;

            var btn = $('<div class="full-start__button selector view--ua-online" style="background: #24b353 !important; color: #fff !important; border-radius: 5px; margin-right: 10px;"><svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" style="fill: white; vertical-align: middle; margin-right: 5px;"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg><span>UA Online</span></div>');

            btn.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'UA Online',
                    component: 'ua_online',
                    movie: e.data.movie,
                    page: 1
                });
            });

            $('.full-start__buttons').prepend(btn);
        };

        // Слухаємо відкриття картки
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                addBtn(e);
            }
        });

        // Реєструємо компонент
        Lampa.Component.add('ua_online', UAOnline);
    }

    // Запуск з перевіркою оточення
    try {
        if (window.appready) startPlugin();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') startPlugin();
            });
        }
    } catch (err) {
        console.error("UAkino Error: ", err);
    }
})();
