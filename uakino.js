(function () {
    'use strict';

    function UAOnline(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var items   = [];
        var html    = $('<div></div>');
        
        this.create = function () {
            var _this = this;
            var query = object.search || (object.movie ? (object.movie.title || object.movie.name) : '');
            
            // Відображаємо лоадер, як у твого файлу
            scroll.append(Lampa.Template.get('lampac_content_loading', {}));
            
            // Запит до UAkino
            var url = 'https://uakino.best/index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
            
            network.native(url, function(str) {
                _this.build(str);
            }, function() {
                _this.empty('Помилка доступу до UAkino');
            }, false, {dataType: 'text'});

            return scroll.render();
        };

        this.build = function(str) {
            var _this = this;
            scroll.clear();
            
            var dom = $(str.replace(/<img/g, '<img-disabled'));
            var results = dom.find('.movie-item, .shortstory');

            if (results.length > 0) {
                results.each(function() {
                    var el = $(this);
                    var title = el.find('.movie-title, h2').text().trim();
                    var link = el.find('a').attr('href');
                    var img = el.find('img-disabled').attr('src');

                    // Створюємо картку в стилі Lampa
                    var item = Lampa.Template.get('button_card', {
                        title: title,
                        description: 'UAkino'
                    });

                    if (img) item.find('img').attr('src', img.startsWith('http') ? img : 'https://uakino.best' + img);

                    item.on('hover:enter', function() {
                        _this.extractVideo(link);
                    });

                    scroll.append(item);
                });
            } else {
                _this.empty();
            }
            
            Lampa.Controller.enable('content');
        };

        this.extractVideo = function(url) {
            Lampa.Noty.show('Шукаємо відео...');
            network.native(url, function(html) {
                var iframe = $(html).find('iframe[src*="ashdi"], iframe[src*="vidmoly"], iframe[src*="uaserials"]').attr('src');
                if (iframe) {
                    if (iframe.startsWith('//')) iframe = 'https:' + iframe;
                    Lampa.Player.play({
                        url: iframe,
                        title: object.movie.title || object.movie.name
                    });
                } else {
                    Lampa.Noty.show('Плеєр не знайдено');
                }
            }, function() {
                Lampa.Noty.show('Помилка сторінки');
            }, false, {dataType: 'text'});
        };

        this.empty = function(text) {
            scroll.clear();
            scroll.append('<div class="empty">' + (text || 'Нічого не знайдено') + '</div>');
        };
    }

    // Реєстрація як у твого зразка
    function start() {
        Lampa.Component.add('ua_online', UAOnline);

        Lampa.Listener.follow('online', function (e) {
            if (e.type == 'start') {
                var item = {
                    title: 'UA Online',
                    name: 'ua_online',
                    onSelect: function() {
                        Lampa.Activity.push({
                            title: 'UA Online',
                            component: 'ua_online',
                            movie: e.movie,
                            page: 1
                        });
                    }
                };
                // Додаємо в список джерел
                e.sources.push(item);
            }
        });
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') start();
    });

})();
