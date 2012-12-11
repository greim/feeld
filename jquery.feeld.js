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
    var $select = $self.find('select');

    $input.each(function(){
      var data = $(this).attr('data-options') || '{}';
      data = JSON.parse(data);
      data.field = this;
      var v = new TextField(data);
      v.render();
    });

    $textarea.each(function(){
      var data = $(this).attr('data-options') || '{}';
      data = JSON.parse(data);
      data.field = this;
      var v = new TextField(data);
      v.render();
    });

    $select.each( function() {
      var data = $(this).attr('data-options') || '{}';
      data = JSON.parse(data);
      data.field = this;
      var v = new Select(data);
      v.render();
    });

    return this;
  };

  // ################################################################
  // views

  // abstract class to handle common events etc
  var Control = Backbone.View.extend({

    initialize: function(){
      this.field = this.options.field;
      $(this.field).replaceWith(this.el);
    },
    events: {
      'click': 'click',

      'focus input, textarea, select': 'focus',
      'blur input, textarea, select': 'blur',
      'keydown input, textarea, select': 'keydown',
      'change input, textarea, select': 'change'
    },

    click: function(ev){
	console.log( 'click' );
      $(this.field).focus();
    },
    focus: function(ev){
	console.log( 'focus' )
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

 
    commonRender: function() {
      var field = this.field;
      this.$el.html(this.layout);
      this.$box = this.$('.tf');
 
      if (field.disabled) {
        this.$box.addClass('tf-disabled');
      } else if (field.autofocus) {
        $(field).focus();
      }
      
      if ($(field).hasClass('error')) {
        this.$box.addClass('tf-error');
      }
      
      if ($(field).is('[title]')) {
        this.$box.addClass('tf-tip');
        var tip = $(field).attr('title');
        var text = $('<span class="tf-tip-text"></span>');
        text.text(tip);
        text.appendTo(this.$('.tf-icon-after .tf-icon-inner'));
        if (tip.length > 25) {
          this.$box.addClass('tf-bigtip');
        }
      }
    }
  }); 

  var TextField = Control.extend({
    initialize: function( args ) {
	this.constructor.__super__.initialize.call( this, args );
	this.events = $.extend({
	    'paste input, textarea, select': 'paste',
	    'cut input, textarea, select': 'paste'
	}, this.events);
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

    paste: function(ev){
      this.checkChange(ev);
    },
    cut: function(ev){
      this.checkChange(ev);
    },

    showFocus: function(){
	console.log( 'showFocus' );
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
      this.constructor.__super__.commonRender.apply( this );
      
      this.$('.tf-placeholder-inner').text(this.field.placeholder);
      this.field.placeholder = '';
      this.currentVal = this.field.value;
      this.$('.tf-field-inner').html(this.field);
      this.maxLength = parseInt($(this.field).attr('maxlength'));
      if (this.maxLength) {
        var $counter = $(this.counterLayout);
        $counter.find('.tf-counter-num').html(this.currentVal.length);
        $counter.find('.tf-counter-den').html(this.maxLength);
        this.$('.tf-field').after($counter);
      }
      if (this.field.value) {
        this.$box.addClass('tf-inuse');
      }
     if ($(this.field).hasClass('search')) {
        this.$box.addClass('tf-search');
      }
     if ($(this.field).is('textarea')) {
        this.$box.addClass('tf-area');
        this.$('.tf-icon').remove();
      }
    }
  });

  var Select = Control.extend({
    initialize: function( args ) {
      this.constructor.__super__.initialize.apply( this, args );
    },

    layout: '<span class="tf fc-select">'
      + '<span class="fc-s-arrow"></span>'
      + '<span class="fc-s-text"></span>'
      + '</span>',

    listLayout: '<ul class="fc-options"></ul>',
    
    optionLayout: '<li class="fc-option"></li>',

    click: function( e ) {
	console.log( 'select click', this, this.events );

      $(this.field).focus();
    },

    render: function() {
	var self = this;
	this.constructor.__super__.commonRender.apply( this );

	this.$list = $( this.listLayout );

	console.log( this.$box, this.$list, this.field.options );

	_.each( this.field.options, function( opt ) {
	    console.log( opt );
	    var $o = $( self.optionLayout ).text( opt.text );
	    self.$list.append( $o );
	});

	this.$box.append( this.$list );
    }
  });

})(jQuery);




