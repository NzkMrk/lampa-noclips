(function () {
    'use strict';

    function UAOnline(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        
        this.create = function () {
            var _this = this;
            var query = object.search || (object.movie ? (object.movie.title || object.movie.name) : '');
            var html = $('<div style="padding: 2em; text-align: center;"><div class="wait">Шукаємо на UAkino: ' + query + '...</div></div>');
            
            scroll.append(html);

            // Пошук на сайті UAkino
            var searchUrl = 'https://uakino.best/index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
            
            network.native(searchUrl, function(str) {
                scroll.clear();
                // Очищаємо HTML від картинок, щоб не гальмувало
                var cleanHtml = str.replace(/<img/g, '<img-disabled');
                var dom = $(cleanHtml);
                var items = dom.find('.movie-item');

                if (items.length > 0) {
                    items.each(function() {
                        var el = $(this);
                        var title = el.find('.movie-title, h2').text().trim();
                        var link = el.find('a').attr('href');

                        var card = $('<div class="selector" style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;">' +
                            '<div style="font-size: 1.2em;">' + title + '</div>' +
                            '<div style="color: #24b353; font-size: 0.8em;">uakino.best</div>' +
                        '</div>');
                        
                        card.on('hover:enter', function() {
                            Lampa.Noty.show('Завантаження плеєра...');
                            _this.extractVideo(link);
                        });
                        
                        scroll.append(card);
                    });
                } else {
                    scroll.append('<div style="padding: 2em; text-align: center;">Нічого не знайдено на UAkino</div>');
                }
                Lampa.Controller.enable('content');
            }, function() {
                scroll.clear();
                scroll.append('<div style="padding: 2em; text-align: center;">Помилка мережі (CORS). Спробуйте на Android TV.</div>');
            }, false, {dataType: 'text'});

            return scroll.render();
        };

        // Функція для отримання відео з конкретної сторінки
        this.extractVideo = function(url) {
            network.native(url, function(html) {
                var videoFrame = $(html).find('iframe[src*="ashdi"], iframe[src*="vidmoly"]').attr('src');
                if (videoFrame) {
                    // Якщо знайшли фрейм, запускаємо його в плеєрі Лампи
                    Lampa.Player.play({
                        url: videoFrame,
                        title: object.movie.title
                    });
                } else {
                    Lampa.Noty.show('Плеєр не знайдено на сторінці');
                }
            });
        };
    }

    function startPlugin() {
        Lampa.Noty.show('UA Online: Активовано');
        Lampa.Component.add('ua_online', UAOnline);

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
