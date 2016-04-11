/*!
 * jQuery Command Center Wishlist Plugin
 * Original author: Joep Driesen
 * Licensed under the GNU GPL v3 license
 *
 * This CommandCenter plugin allows the user to register stuff he would like
 * to buy in the future, with an expected cost, a label and a priority.
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
    var pluginName = 'CC_gh_wishlist',
        defaults = {
    		app_name: 'CC_gh_wishlist',
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
		let self = this;
		
		self._storage = githubEncryptedStorage(self.options);
		self.labels = $.when ( self._storage.labels() )
		
		self.init_header();
		
		self.reload_wishlist();
		
		self.$add_item_modal = $(
			'<form id="add-item-modal" class="modal fade" tabindex="-1" role="dialog">' +
			'  <div class="modal-dialog">' +
			'    <div class="modal-content">' +
			'      <div class="modal-header">' +
			'        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
			'        <h4 class="modal-title">Add Wishlist Item</h4>' +
			'      </div>' +
			'      <div class="modal-body row">' +
			'        <div class="form-group col-xs-12">' +
			'		 	<label class="pull-left">Name:</label>' +
			'		 	<input id="add-item-name" class="form-control" type="text">' +
			'		 </div>' +
			'        <div class="form-group col-xs-12">' +
			'		 	<label class="pull-left">URL:</label>' +
			'		 	<input id="add-item-url" class="form-control" type="text">' +
			'		 </div>' +
			'        <div class="form-group col-xs-12 col-md-6">' +
			'			<label class="pull-left">Priority:</label>' +
			'		 	<input id="add-item-priority" class="form-control col-xs-6" type="number">' +
			'		 </div>' +
			'        <div class="form-group col-xs-12 col-md-6">' +
			'			<label class="pull-left">Est. Price:</label>' +
			'		 	<input id="add-item-price" class="form-control col-xs-6" type="number">' +
			'		 </div>' +
			'      </div>' +
			'      <div class="modal-footer">' +
			'        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
			'      </div>' +
			'    </div>' +
			'  </div>' +
			'</form>'
		);
		self.$add_item_modal.hide();
		$('body').append(self.$add_item_modal);
		
		self.labels.then(function(labels) {
			var $buttons = $('<div class="form-group btn-group col-xs-12" data-toggle="buttons-radio"></div>');
				
			$.each(labels, function(label_i, label) {
				$label = $('<a href="#" class="btn btn-item-label" style="background-color:#' + label.color + ' !important;">' + label.name + '</a>');
				
				$label.click(function() {
					$buttons.find('a').removeClass('selected');
					$buttons.find('input').removeClass('selected');
					$buttons.find('input').val('');
					$(this).addClass('selected');
					
					return false;
				});
				
				$buttons.append($label);
			});
			
			$new_label_input = $('<input class="form-control new-label-input" type="text" placeholder="New Label">');
			$new_label_input.css({
				display: 'inline-block',
				width: 'auto',
				'margin-left': '10px'
			});
			$new_label_input.focus(function() {
				$buttons.find('a').removeClass('selected');
				$(this).addClass('selected');
			});
			
			$buttons.append($new_label_input);
			
			self.$add_item_modal.find('.modal-body').append($buttons);
		});
		
		$submit = $('<button type="button" class="btn btn-primary">Save</button>');
		self.$add_item_modal.find('.modal-footer').append($submit);
		
		$submit.click(function() {
			var name = $('#add-item-name').val();
			var url = $('#add-item-url').val();
			var priority = $('#add-item-priority').val();
			var price = $('#add-item-price').val();
			
			var label = self.$add_item_modal.find('a.btn-item-label.selected').text();
			if (!label)
				label = self.$add_item_modal.find('input.selected').val();
			if (!label)
				label = self.$add_item_modal.find('a.btn-item-label:first').text();
			
			$.when ( self._storage.saveObject({
				name: name,
				url: url,
				priority: priority,
				price: price,
			}, [label]) ).then( function(d) {
				self.reload_wishlist.bind(self)(d);
				self.init_header();
			});
			
			self.$add_item_modal.modal('hide');
		});
		
		self.$add_item_modal.on('shown.bs.modal', function () {
			self.$add_item_modal.find('#add-item-title').focus();
		});
    };
    
    Plugin.prototype.init_header = function() {
    	var self = this;
		
		$title_bar = this.element.parent().parent().find('.panel-heading');

		$title_bar.find('a.btn-label-filter').remove();
		$title_bar.find('span.filter-heading').remove();
		$title_bar.find('a#add-item-btn').remove();
		
		// Create 'Add item' button
		$add_item_btn = $('<a href="#" id="add-item-btn" class="btn btn-success btn-xs pull-right">Add Item</a>');
		$add_item_btn.click(this.add_item.bind(this));
		$title_bar.append($add_item_btn);
    	
    }
	
	Plugin.prototype.add_item = function() {
		let self = this;
		
		self.$add_item_modal.find('input').val('');
		self.$add_item_modal.modal();
	};
	
	Plugin.prototype.filter_labels = function (new_filter_labels) {
		if (new_filter_labels) {
			localStorage.setItem('CC-gh-wishlist_filter-labels', JSON.stringify(new_filter_labels));
		}
		
		var filter_labels = JSON.parse(localStorage.getItem('CC-gh-wishlist_filter-labels'));
		
		if (!filter_labels)
			return [];
		return filter_labels;
	};
	
	Plugin.prototype.reload_wishlist = function() {
		let self = this;
		
		$.when ( self._storage.objects(self.filter_labels()) ).then(function(objects) {
			objects.sort(function (a, b) { return a.json.priority - b.json.priority });
			
			self.element.empty();
			
			$.each(objects, function(object_i, object) {
				let item = object.json;
				
				var $item = $(
					'<div class="col-xs-12">' +
						'<div class="alert alert-prior">' +	
							'<a href="' + item.url + '">' + item.name + '</a>' +
							'<span class="badge">' + item.priority + '</span>' +
							'<br><span>€' + item.price + '</span>' +
						'</div>' +
					'</div>'
				);
				$item.hide();
				self.element.append($item);
				
				$item = $item.find('.alert');
				$item.css({
					color: '#fff',
					'background-color': '#' +  (object.labels.length > 0 ? object.labels[0].color : '000'),
				});
			
				var $delete = $('<button class="close" type="button">×</button>');
				$item.prepend($delete);
				
				(function(object, $item) {
					$delete.click(function() {
						$.when ( self._storage.removeObject(object.id) ).then($item.parent().fadeOut(300, $item.parent().remove));
					});
				})(object, $item);
				
				$item.parent().fadeIn(300);
			});
		});
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
