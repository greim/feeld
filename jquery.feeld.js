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
      /*
       * Supported options
       * selectors: { type, selector } restricts converting form elements to only these selectors
       * excludes: (string) selectors to exclude
       */
    opts = $.extend({
      // nothing here yet
    }, opts);

    var $self = $(this),
      selectors = opts.selectors || [
        { type: 'TextField', selector: 'input[type="text"],input[type="password"],textarea' },
        { type: 'Select', selector: 'select' },
        { type: 'Tooltip', selector: '.tooltip' },
        { type: 'Checkbox', selector: 'input[type="checkbox"]:not(.fc-switch)' },
        { type: 'Switch', selector: 'input[type="checkbox"].fc-switch' }
      ],
      excludes = opts.excludes || '';

    _.each(selectors, function( o ) {
      $self.find(o.selector).not(excludes).each(function(){
        var data = $(this).attr('data-options') || '{}', type = eval(o.type);
        data = JSON.parse(data);
        data.field = this;
        if ( typeof type == 'function' ) {
          var v = new type(data);
          v.render();
        }
      });
    });

    return this;
  };

  // ################################################################
  // views

  // abstract class to handle common events etc
  var Control = Backbone.View.extend({

    initialize: function(){
      this.field = this.options.field;
      this.field.control = this;
      $(this.field).addClass('raw-feeld');
      $(this.field).replaceWith(this.el);
    },
    events: {
      'click input, textarea': 'click',
      'focus input, textarea, select': 'focus',
      'blur input, textarea, select': 'blur',
      'change input, textarea, select': 'change'
    },

    click: function(ev){
      //console.log( 'super click', this.input );
    },
    focus: function(ev){
      //console.log( 'super focus', this.input );
      this.showFocus(ev);
    },
    blur: function(ev){
      this.showBlur(ev);
    },
    change: function(ev){
      this.checkChange(ev);
    },
 
    showFocus: function(){
      this.$box.addClass('fc-focus');
    },

    showBlur: function(){
      this.$box.removeClass('fc-focus');
    },

    isActive: function() {
      return this.$box.hasClass('fc-active');
    },

    checkDisabled: function(){
      this.$box[this.field.disabled ? 'addClass' : 'removeClass']('fc-disabled');
    },

    commonRender: function() {
      var field = this.field;
      this.$el.html(this.layout);
      this.$box = this.$('.fc-box');
 
      this.checkDisabled();
      
      if (field.autofocus) {
        $(field).focus();
      }
      
      if ($(field).hasClass('error')) {
        this.$box.addClass('fc-error');
      }

      // TODO: consider moving this section to TextField, doesn't apply to textboxes etc?
      if ($(field).is('[title]')) {
        this.$box.addClass('fc-tip');
        var tip = $(field).attr('title');
        var text = $('<span class="fc-tip-text"></span>');
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
        'keydown input, textarea': 'keydown',
        'paste input, textarea': 'paste',
        'cut input, textarea': 'paste'
      }, this.events);
    },
    
    click: function(ev){
      //console.log( 'textfield click', this.input );
      $(this.input).focus();
    },

    layout: '<span class="fc fc-tf fc-box">'
      +'<span class="tf-inner">'
        +'<span class="tf-icon tf-icon-before">'
          +'<span class="tf-icon-inner"></span>'
        +'</span>'
        //+'<span class="tf-placeholder">'
        //  +'<span class="tf-placeholder-inner"></span>'
        //+'</span>'
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

    keydown: function(ev){
      this.checkChange(ev);
    },
    paste: function(ev){
      this.checkChange(ev);
    },
    cut: function(ev){
      this.checkChange(ev);
    },

    showFocus: function(){
      this.$box.addClass('fc-focus');
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
      
      //this.$('.tf-placeholder-inner').text(this.field.placeholder);
      //this.field.placeholder = '';
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

      this.events = $.extend({
        'keydown select': 'keydown',
        'click .fc-sel-option': 'optionClick',
        'click .fc-sel': 'click',
        'mouseover .fc-sel-option': 'optionHover'
      }, Control.prototype.events);
    },

    layout: '<span class="fc fc-sel fc-box">'
      + '<span class="fc-sel-wrap"><span class="fc-sel-arrow"></span><span class="fc-sel-text"></span></span>'
      + '</span>',

    listLayout: '<ul class="fc-sel-options"></ul>',

    optionLayout: '<li class="fc-sel-option"></li>',

    click: function( e ) {
      if ( this.$box.hasClass('fc-focus') ) {
        clearTimeout( this.blurTimeout );
      }

      $(this.field).focus();
      this.showOptions();
    },

    showBlur: function( e ) {
      var self = this;

      e.stopPropagation();

      this.blurTimeout = setTimeout( function() {
        self.$box.removeClass('fc-focus');
        self.hideOptions();
      }, 200);
    },

    showOptions: function() {
      var idx = this.selectedIndex = this.selectedIndex === undefined ? 0 : this.selectedIndex;
      this.$box.addClass('fc-active');

      $(this.opts).removeClass('fc-selected');
      $(this.opts[idx]).addClass('fc-selected');
    },

    hideOptions: function() {
      this.$box.removeClass('fc-active');
    },

    checkChange: function() {
      var val = $("option", this.field).filter(':selected').val();

      if ( this.value != val ) {
        //console.log( 'triggered' );
        this.trigger('change', {
          oldValue: self.currentValue,
          newValue: val
        });
        this.value = val;
      }
    },

    selectOption: function( idx ) {
      idx = idx || 0;

      var $displayOpt = $(this.opts[idx]),
        $valueOpts = $(this.field.options),
        $valueOpt = $(this.field.options[idx]);

      $(this.opts).removeClass('fc-selected');
      $displayOpt.addClass('fc-selected');

      $valueOpts.attr('selected', false);
      $valueOpt.attr('selected', true);

      this.currentText = $valueOpt.text();
      this.selectedIndex = this.field.selectedIndex = idx;
      this.$('.fc-sel-text').text( this.currentText );

      this.checkChange();
    },

    keydown: function( e ) {
      // TODO: chrome loses focus of the feeld input after up/down arrow and no longer fires events, ff ok
      //console.log('before', e.keyCode, this.selectedIndex, this.opts );
      if ( !this.isActive() && $.inArray(e.keyCode, [38, 40]) > -1 ) { // if options aren't showing, don't change the index and show the
        this.selectedIndex = this.selectedIndex || 0;
        this.showOptions();
      } else if (e.keyCode == 38) { // up
        if ( this.selectedIndex === 0 || this.selectedIndex == undefined ) {
          this.selectedIndex = this.opts.length - 1;
        } else {
          this.selectedIndex--;
        }

        this.showOptions();
      } else if (e.keyCode == 40) { // down
        if ( this.selectedIndex === 0 || this.selectedIndex < this.opts.length - 1 ) {
          this.selectedIndex++;
        } else if (!this.selectedIndex || this.selectedIndex == this.opts.length - 1 ) {
          this.selectedIndex = 0;
        }

        this.showOptions();
      } else if (e.keyCode == 13 || e.keyCode == 39 || e.keyCode == 9) { // enter, tab
        this.selectOption( this.selectedIndex );
      }

      //console.log('after', e.keyCode, this.selectedIndex, this.opts );
      var $opt = $(this.opts[this.selectedIndex]);
      $(this.opts).removeClass('fc-selected');
      $opt.addClass('fc-selected');
      this.currentText = $opt.text();
      this.$('.fc-sel-text').text( this.currentText );
    },

    optionHover: function() {
      $(this.opts).removeClass('fc-selected');
    },

    optionClick: function( e ) {
      e.stopPropagation();
      e.preventDefault();
      clearTimeout( this.blurTimeout );

      this.selectOption( $(e.currentTarget).index() );
      this.hideOptions();
      this.field.focus();
      //this.checkChange();
    },

    render: function() {
      var self = this, $opts = $('option', this.field), opt;
      this.constructor.__super__.commonRender.apply( this );

      this.value = this.field.value;

      opt = $opts.filter(':selected')[0] || $opts[0];
      this.currentText = opt && $(opt).text();
      this.selectedIndex = this.field.selectedIndex;

      this.$list = $( this.listLayout );
      this.opts = [];
      this.$text = this.$('.fc-sel-text').text( this.currentText );

      _.each( this.field.options, function( opt ) {
        var $o = $( self.optionLayout ).text( opt.text );
        self.$list.append( $o );
        self.opts.push( $o[0] );
      });

      this.$box.append( this.$list );
      this.$box.append( this.field );
    }
  });

  var Checkbox = Control.extend({
    tagName: 'span',
    layout: '<span class="fc-checkbox fc-box fc"><span class="fc-checkmark"></span></span>',
    focus: function( e ) {
      this.showFocus();
    },
    checkChange: function() {
      //console.log( 'checkbox change', this.field.checked );

      this.field.checked ? this.$box.addClass('fc-checked') : this.$box.removeClass('fc-checked');
      this.trigger('change');
    },
    render: function() {
      this.constructor.__super__.commonRender.apply( this );

      if ( $(this.field).attr('checked') ) {
        this.$box.addClass('fc-checked');
      }

      this.$box.append( this.field );
    }
  });

  var Switch = Checkbox.extend({
    tagName: 'span',
    layout: '<span class="fc-switch fc-box">' +
      '<span class="fc-switch-left"></span><span class="fc-switch-toggle"></span><span class="fc-switch-right"></span>' +
      '</span>'
  });

  var Tooltip = Backbone.View.extend({

    initialize: function(){
      this.field = this.options.field;
      $(this.field).replaceWith(this.el);
      this.customHtml = $(this.field).html();
    },

    layout: '<span class="fc-tip fc-tooltip">'
      + '<span class="fc-icon"></span>'
      + '<span class="fc-tip-text"></span>'
      +'</span>',

    render: function() {
      this.$el.html(this.layout);
      this.$el.find('.fc-tip-text').html(this.customHtml);
      if (this.customHtml.length > 25) {
        this.$el.addClass('fc-bigtip');
      }
    }
  });

  // ###########################################################
  // automatically update disabled class

  if (typeof document.getElementsByClassName === 'function') {
    var rawFields = document.getElementsByClassName('raw-feeld');
    (function check(){
      var len = rawFields.length;
      for (var i=0; i<len; i++) {
        var rawField = rawFields[i],
          isDisabled = rawField.disabled,
          control = rawField.control;
        if (!control) {
          continue;
        }
        if (!rawField.feeldProps) {
          rawField.feeldProps = {
            disabled: isDisabled
          };
        } else {
          if (rawField.feeldProps.isDisabled !== isDisabled && typeof control.checkDisabled === 'function') {
            control.checkDisabled();
          }
        }
      }
      setTimeout(check, len === 0 ? 999 : 333);
    })();
  }

})(jQuery);


