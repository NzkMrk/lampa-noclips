(function () {
    'use strict';

    // 1. Основна логіка пошуку та парсингу
    function UAOnlineParser(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        
        this.create = function () {
            var _this = this;
            var query = object.search || (object.movie ? (object.movie.title || object.movie.name) : '');
            
            // Візуальна частина
            var html = $('<div class="wait" style="padding: 20px; text-align: center;">Шукаємо українською: ' + query + '...</div>');
            scroll.append(html);

            // Викликаємо пошук
            this.search(query);

            return scroll.render();
        };

        this.search = function(query) {
            var _this = this;
            // Тимчасово виведемо текст, поки ми не прописали fetch до сайтів
            setTimeout(function() {
                scroll.clear();
                scroll.append('<div style="padding:20px; text-align:center;">Тут будуть результати з UAkino та UASerials для: ' + query + '</div>');
            }, 1000);
        };
    }

    // 2. Інтеграція в кнопку "Дивитися"
    function startPlugin() {
        // Реєструємо компонент
        Lampa.Component.add('ua_online', UAOnlineParser);

        // Слухаємо подію відкриття меню "Онлайн"
        Lampa.Listener.follow('online', function (e) {
            if (e.type == 'start') {
                // Додаємо наше джерело в список, який з'являється при натисканні "Дивитися"
                e.sources.push({
                    title: 'UA Online (UAkino/UASerials)',
                    name: 'ua_online',
                    onSelect: function() {
                        Lampa.Activity.push({
                            url: '',
                            title: 'UA Online',
                            component: 'ua_online',
                            movie: e.movie,
                            page: 1
                        });
                    }
                });
            }
        });
        
        console.log('UA Online: Integrated into Online menu');
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') startPlugin();
    });
})();
