(function () {
    'use strict';

    // 1. Компонент, який відображає результати пошуку
    function UAOnline(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        
        this.create = function () {
            var _this = this;
            var query = object.search || (object.movie ? (object.movie.title || object.movie.name) : '');
            var html = $('<div style="padding: 20px; text-align: center;"><div class="wait">Запит до UAkino для: ' + query + '...</div></div>');
            
            scroll.append(html);

            // Виконуємо запит до сайту
            var url = 'https://uakino.best/index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
            
            network.native(url, function(str) {
                scroll.clear();
                var dom = $(str.replace(/<img/g, '<img-disabled')); 
                var items = dom.find('.movie-item');

                if (items.length > 0) {
                    items.each(function() {
                        var el = $(this);
                        var title = el.find('.movie-title').text();
                        var link = el.find('a').attr('href');

                        var card = $('<div class="selector" style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between;"><div>' + title + '</div><div style="color: #24b353;">UAkino</div></div>');
                        
                        card.on('hover:enter', function() {
                            Lampa.Noty.show('Ви обрали: ' + title);
                            // Тут пізніше додамо виклик плеєра
                        });
                        
                        scroll.append(card);
                    });
                } else {
                    scroll.append('<div style="padding: 20px; text-align: center;">На жаль, на UAkino нічого не знайдено.</div>');
                }
                
                Lampa.Controller.enable('content'); // Вмикаємо керування пультом
            }, function() {
                scroll.clear();
                scroll.append('<div style="padding: 20px; text-align: center;">Помилка мережі або CORS. Спробуйте через лампу на Android.</div>');
            }, false, {dataType: 'text'});

            return scroll.render();
        };
    }

    // 2. Інтеграція в кнопку "Дивитися"
    function startPlugin() {
        // Реєструємо компонент у системі
        Lampa.Component.add('ua_online', UAOnline);

        // Перехоплюємо натискання на кнопку "Онлайн/Дивитися"
        Lampa.Listener.follow('online', function (e) {
            if (e.type == 'start') {
                // Додаємо наш плагін у список джерел
                e.sources.push({
                    title: 'UA Online (UAkino)',
                    name: 'ua_online',
                    onSelect: function() {
                        Lampa.Activity.push({
                            title: 'UA Online',
                            component: 'ua_online',
                            movie: e.movie,
                            page: 1
                        });
                    }
                });
            }
        });
    }

    // Запуск плагіна
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') startPlugin();
    });
})();
