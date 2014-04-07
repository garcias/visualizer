define(['modules/default/defaultview', 'components/twig.js/twig.min'], function(Default, Twig) {

    function view() {
    }
    ;
    view.prototype = $.extend(true, {}, Default, {
        init: function() {
            var html = "";
            html += '<div></div>';

            this.dom = $(html).css({
                height: '100%',
                width: '100%'
            });

            this.module.getDomContent().html(this.dom);
            this._values = new DataObject();
            this.template = Twig.twig({
                data: this.module.getConfiguration('template')
            });
        },
        blank: {
            value: function(varName) {
                this.dom.empty();
            }
        },
        inDom: function() {
        },
        update: {
            value: function(value, name) {
                if (!value) {
                    return;
                }
                this._values[name] = value.get();

                this.dom.html(this.template.render(this._values));

            },
            tpl: function(value) {
                if (!value)
                    return;
                var tpl = value.get();
                try {
                    var template = Twig.twig({
                        data: tpl
                    });
                    this.dom.html(template.render(this._values));
                    this.module.definition.configuration.groups.group[0].template[0] = tpl;
                    this.template = template;
                } catch (e) {
               }
            }
        }
    });

    return view;
});