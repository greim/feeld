/**
Copyright (c) 2012 gr ***AT*** wayin ***DOT*** com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function($){
  $.fn.feeld = function(opts){
    opts = $.extend({
      // nothing here yet
    }, opts);

    var $self = $(this);

    var $input = $self.find('input[type="text"],input[type="password"]');
    var $textarea = $self.find('textarea');

    $input.each(function(){
      var data = $(this).attr('data-options') || '{}';
      data = JSON.parse(data);
      data.field = this;
      var v = new TextField(data);
      v.render();
    });

    return this;
  };

  // ################################################################
  // views

  var TextField = Backbone.View.extend({

    initialize: function(){
      this.field = this.options.field;
      $(this.field).replaceWith(this.el);
    },

    layout: '<span class="tf">'
      +'<span class="tf-inner">'
        +'<span class="tf-icon tf-icon-before">'
          +'<span class="tf-icon-inner"></span>'
        +'</span>'
        +'<span class="tf-placeholder">'
          +'<span class="tf-placeholder-inner"></span>'
        +'</span>'
        +'<span class="tf-field">'
          +'<span class="tf-field-inner"></span>'
        +'</span>'
        +'<span class="tf-icon tf-icon-after">'
          +'<span class="tf-icon-inner"></span>'
        +'</span>'
      +'</span>'
    +'</span>',

    counterLayout: '<span class="tf-counter">'
      +'<span class="tf-counter-inner">'
        +'<span class="tf-counter-num"></span>'
        +' / '
        +'<span class="tf-counter-den"></span>'
      +'</span>'
    +'</span>',

    events: {
      'click': 'click',
      'focus input': 'focus',
      'blur input': 'blur',
      'keydown input': 'keydown',
      'change input': 'change'
    },

    click: function(ev){
      $(this.input).focus();
    },
    focus: function(ev){
      this.showFocus(ev);
    },
    blur: function(ev){
      this.showBlur(ev);
    },
    keydown: function(ev){
      this.checkChange(ev);
    },
    change: function(ev){
      this.checkChange(ev);
    },

    showFocus: function(){
      this.$box.addClass('tf-focus');
    },

    showBlur: function(){
      this.$box.removeClass('tf-focus');
    },

    checkChange: function(){
      var self = this;
      setTimeout(function(){
        var val = self.field.value;
        if (val !== self.currentValue) {
          self.trigger('change', {
            oldValue: self.currentValue,
            newValue: val
          });
          self.currentValue = val;
          if (!val) {
            self.$box.removeClass('tf-inuse');
          } else {
            self.$box.addClass('tf-inuse');
            clearTimeout(self.timeout);
            self.timeout = setTimeout(function(){
              self.trigger('pause', val);
            }, 500);
          }
        }
        self.$('.tf-counter-num').html(val.length);
      },1);
    },

    render: function() {
      var field = this.field;
      this.$el.html(this.layout);
      this.$box = this.$('.tf');
      this.$('.tf-placeholder-inner').text(field.placeholder);
      field.placeholder = '';
      this.currentVal = field.value;
      this.$('.tf-field-inner').html(field);
      this.maxLength = parseInt($(this.field).attr('maxlength'));
      if (this.maxLength) {
        var $counter = $(this.counterLayout);
        $counter.find('.tf-counter-num').html(this.currentVal.length);
        $counter.find('.tf-counter-den').html(this.maxLength);
        this.$('.tf-field').after($counter);
      }
      if (field.value) {
        this.$box.addClass('tf-inuse');
      }
      if (field.disabled) {
        this.$box.addClass('tf-disabled');
      } else if (field.autofocus) {
        $(field).focus();
      }
      if ($(field).hasClass('search')) {
        this.$box.addClass('tf-search');
      }
      if ($(field).hasClass('error')) {
        this.$box.addClass('tf-error');
      }
    }
  });

})(jQuery);




