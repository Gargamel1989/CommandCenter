/*!
 * jQuery Command Center
 * Original author: Joep Driesen
 * Licensed under the GNU GPL v3 license
 */


// the semi-colon before the function invocation is a safety 
// net against concatenated scripts and/or other plugins 
// that are not closed properly.
;(function ( $, window, document, undefined ) {
    
    // undefined is used here as the undefined global 
    // variable in ECMAScript 3 and is mutable (i.e. it can 
    // be changed by someone else). undefined isn't really 
    // being passed in so we can ensure that its value is 
    // truly undefined. In ES5, undefined can no longer be 
    // modified.
    
    // window and document are passed through as local 
    // variables rather than as globals, because this (slightly) 
    // quickens the resolution process and can be more 
    // efficiently minified (especially when both are 
    // regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = 'CC',
        defaults = {
			title: "Command Center v0.1",
			
			blocks: [],
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        // jQuery has an extend method that merges the 
        // contents of two or more objects, storing the 
        // result in the first object. The first object 
        // is generally empty because we don't want to alter 
        // the default options for future instances of the plugin
        this.options = $.extend( {}, defaults, options) ;
        
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();
    }

    Plugin.prototype.init = function () {
		if (this.options.title)
			document.title = this.options.title;
			
		this.element.html(
			'<div class="navbar navbar-default navbar-fixed-top">' +
				'<div class="container">' +
					'<div class="navbar-header">' +
						'<a class="navbar-brand" href="/">' + this.options.title + '</a>' +
						'<button class="navbar-toggle" data-target="#navbar-main" data-toggle="collapse" type="button">' +
							'<span class="icon-bar"></span>' +
							'<span class="icon-bar"></span>' +
							'<span class="icon-bar"></span>' +
						'</button>' +
					'</div>' +
				'</div>' +
			'</div>'
		);
		
		this.$content = $('<div id="content" class="container"><div class="row"></div></div>');
		this.element.append(this.$content);
		this.$content = this.$content.find('.row');
		
		for (block_name in this.options.blocks) {
			var block_options = this.options.blocks[block_name];
			
			var block_options = $.extend({
				name: block_name,
				type: null,
				
				sizeClass: 'col-xs-12 col-sm -6 col-md-3',
			}, block_options);
			
			var $block = $(
				'<div class="' + block_options.sizeClass + '">' +
					'<div class="panel panel-default">' +
						'<div class="panel-heading"><strong>' + block_options.name + '</strong></div>' +
						'<div class="panel-body panel-block">' +
							'<div class="block row">' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>'
			);
			
			this.$content.append($block);
			
			if (block_options.type === 'gh_todo') {
				$block.find('.block').CC_gh_todo(block_options);
			} else if (block_options.type === 'heartbeat') {
				$block.find('.block').CC_heartbeat(block_options);
			}
		}
    };
	
    // A really lightweight plugin wrapper around the constructor, 
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        if (!$.data(this, 'plugin_' + pluginName)) {
            $.data(this, 'plugin_' + pluginName, 
            new Plugin( this, options ));
            
            return $.data(this, 'plugin_' + pluginName);
        }
    }

})( jQuery, window, document );
