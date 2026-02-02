(function () {
    'use strict';

    function UAOnline(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        
        this.create = function () {
            var _this = this;
            // Беремо назву українською або оригінальну
            var query = object.movie.name || object.movie.title;
            var html = $('<div style="padding: 2em; text-align: center;"><div class="wait">Шукаємо на UAkino: ' + query + '...</div></div>');
            
            scroll.append(html);

            // Пошук (використовуємо native для обходу обмежень на ТБ)
            var searchUrl = 'https://uakino.best/index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
            
            network.native(searchUrl, function(str) {
                scroll.clear();
                // Захист від збою парсингу
                var cleanHtml = str.replace(/<img/g, '<img-disabled');
                var dom = $(cleanHtml);
                var items = dom.find('.movie-item, .shortstory');

                if (items.length > 0) {
                    items.each(function() {
                        var el = $(this);
                        var title = el.find('.movie-title, h2, a.sh-link').text().trim();
                        var link = el.find('a').attr('href');

                        if(title && link) {
                            var card = $('<div class="selector" style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 5px;">' +
                                '<div style="font-size: 1.1em; margin-bottom: 4px;">' + title + '</div>' +
                                '<div style="color: #24b353; font-size: 0.8em;">uakino.best</div>' +
                            '</div>');
                            
                            card.on('hover:enter', function() {
                                Lampa.Noty.show('Завантаження сторінки...');
                                _this.extractVideo(link);
                            });
                            
                            scroll.append(card);
                        }
                    });
                } else {
                    scroll.append('<div style="padding: 2em; text-align: center;">На UAkino нічого не знайдено 😕</div>');
                }
                Lampa.Controller.enable('content');
            }, function() {
                scroll.clear();
                scroll.append('<div style="padding: 2em; text-align: center;">Помилка запиту. Перевірте мережу або проксі.</div>');
            }, false, {dataType: 'text'});

            return scroll.render();
        };

        this.extractVideo = function(url) {
            network.native(url, function(html) {
                // Шукаємо посилання на популярні українські плеєри
                var videoFrame = $(html).find('iframe[src*="ashdi"], iframe[src*="vidmoly"], iframe[src*="uaserials"]').attr('src');
                
                if (videoFrame) {
                    // Якщо посилання починається з //, додаємо https:
                    if (videoFrame.startsWith('//')) videoFrame = 'https:' + videoFrame;

                    Lampa.Player.play({
                        url: videoFrame,
                        title: object.movie.name || object.movie.title
                    });
                } else {
                    Lampa.Noty.show('Плеєр не знайдено. Можливо, фільм видалено.');
                }
            }, function() {
                Lampa.Noty.show('Не вдалося відкрити сторінку фільму');
            }, false, {dataType: 'text'});
        };
    }

    function startPlugin() {
        // Реєструємо компонент
        Lampa.Component.add('ua_online_comp', UAOnline);

        // Додаємо джерело в глобальний список Online
        Lampa.Listener.follow('online', function (e) {
            if (e.type == 'start') {
                e.sources.push({
                    title: 'UA Online',
                    name: 'ua_online_comp',
                    onSelect: function() {
                        Lampa.Activity.push({
                            title: 'UA Online',
                            component: 'ua_online_comp',
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
