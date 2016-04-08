/*!
 * jQuery Command Center Heartbeat Plugin
 * Original author: Joep Driesen
 * Licensed under the GNU GPL v3 license
 *
 * This CommandCenter plugin allows the user to check if certain
 * websites are up and their response time.
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
    var pluginName = 'CC_heartbeat',
        defaults = {
			heartbeat_interval: 2000,
			sites: [],
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
		var self = this;
		
		self.site_dict = {};
		
		self.element.empty();
		
		self.$loader = $('<img class="ajax-loader pull-right" src="http://www.insertcart.com/wp-content/plugins/woodiscuz-woocommerce-comments/files/img/loader/ajax-loader-200x200.gif" style="width:18px">');
		
		$.each(self.options.sites, function(i, site) {
			var $alert = $(
				'<div class="col-xs-12">' + 
					'<div class="alert alert-info alert-small">' + 
						'<a href="' + site.name + '">' + site.name + '</a>' +
					'</div>' +
				'</div>');
			$alert.hide();
			self.element.append($alert);
			$alert = $alert.find('.alert');
			$alert.append(self.$loader.clone());
			
			self.site_dict[site.name] = $alert;
			
			// Heartbeat every 5 minutes
			(function(site) {
				var heartbeat_repeater = function() {
					self.heartbeat(site);
					
					setTimeout(heartbeat_repeater, 5*60000);
				}
				
				heartbeat_repeater();
			})(site);
			
			$alert.parent().fadeIn(300);
		});
    };
	
	Plugin.prototype.heartbeat = function(site) {
		var self = this;
		
		$alert = self.site_dict[site.name];
		
		var time = $.now();
		
		(function($alert, time) {
			$img = $('<img src="' + site.test_url + '">');
			$img.on('load', function() {
				$alert.removeClass('alert-info');
				$alert.addClass('alert-success');
				$alert.find('.ajax-loader').remove();
				time = $.now() - time;
				
				if ($alert.find('.time').length == 0)
					$alert.append($('<span class="time pull-right"></span>'));
					
				$alert.find('.time').text(time + 'ms')
			});
			$img.on('error', function() {
				$alert.removeClass('alert-info');
				$alert.addClass('alert-danger');
				$alert.find('.ajax-loader').remove();
				$alert.append($('<span class="glyphicon glyphicon-exclamation-sign pull-right"></span>'));
			});
			
			$img.hide();
			
			self.element.append($img);
		})($alert, time);
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
