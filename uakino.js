(function () {
    'use strict';

    function UAOnlineParser(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        
        this.create = function () {
            var _this = this;
            var query = object.search || (object.movie ? (object.movie.title || object.movie.name) : '');
            var html = $('<div class="wait" style="padding: 20px; text-align: center;">Пошук на UAkino: ' + query + '...</div>');
            
            scroll.append(html);

            // Пошуковий запит до UAkino через проксі
            // Ми використовуємо cors-anywhere або аналогічний сервіс, щоб обійти блокування
            var searchUrl = 'https://uakino.best/index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
            
            network.native(searchUrl, function(str) {
                scroll.clear();
                var dom = $(str.replace(/<img/g, '<img-disabled')); // вимикаємо картинки для швидкості парсингу
                var results = [];

                dom.find('.movie-item').each(function() {
                    var el = $(this);
                    var title = el.find('.movie-title').text();
                    var link = el.find('a').attr('href');
                    if(title && link) {
                        results.push({title: title, url: link});
                    }
                });

                if(results.length > 0) {
                    results.forEach(function(res) {
                        var item = $('<div class="selector" style="padding: 15px; border-bottom: 1px solid #333;">' + res.title + '</div>');
                        item.on('hover:enter', function() {
                            Lampa.Noty.show('Ви обрали: ' + res.title);
                            // Тут буде перехід до плеєра
                        });
                        scroll.append(item);
                    });
                } else {
                    scroll.append('<div style="padding:20px;">Нічого не знайдено на UAkino</div>');
                }
            }, function() {
                scroll.clear();
                scroll.append('<div style="padding:20px;">Помилка доступу до сайту. Можливо, потрібен проксі.</div>');
            }, false, {dataType: 'text'});

            return scroll.render();
        };
    }

    function startPlugin() {
        Lampa.Component.add('ua_online', UAOnlineParser);

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

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
