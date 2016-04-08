/*!
 * jQuery Command Center Github TODO Plugin
 * Original author: Joep Driesen
 * Licensed under the GNU GPL v3 license
 *
 * This CommandCenter plugin allows the user to create a todo list
 * using a github repository issues tracker as database.
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
    var pluginName = 'CC_gh_todo',
        defaults = {
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
	
	Plugin.prototype.filter_labels = function (new_filter_labels) {
		if (new_filter_labels) {
			localStorage.setItem('CC-gh-todo_filter-labels', JSON.stringify(new_filter_labels));
		}
		
		var filter_labels = JSON.parse(localStorage.getItem('CC-gh-todo_filter-labels'));
		
		if (!filter_labels)
			return [];
		return filter_labels;
	};

    Plugin.prototype.init = function () {
		this._storage = $.githubEncryptedStorage(this.options);
		
		this.element.empty();
	
		this.labels = $.when ( this._storage.labels() )
		
		var self = this;
		$title_bar = this.element.parent().parent().find('.panel-heading');
			
		// Create label filter buttons
		this.labels.then(function(labels) {
			$.each(labels, function(i, label) {
				var $filter_label_btn = $('<a href="#" class="btn btn-xs pull-right btn-label-filter">' + label.name + '</a>');
				
				if (self.filter_labels().length <= 0 || self.filter_labels().indexOf(label.name) >= 0)
					$filter_label_btn.addClass('retain');
				
				$filter_label_btn.css({
					color: '#fff',
					'background-color': '#' +  label.color
				});
				
				$filter_label_btn.click(function() {
					$(this).toggleClass('retain');
					
					self.filter_labels($title_bar.find('a.btn-label-filter.retain').map(function(i, $el) { return $el.text; }).toArray());
					
					self.reload_todolist();
					return false;
				});
				$title_bar.append($filter_label_btn);
				
			});
			$title_bar.append($('<span class="pull-right" style="margin-right:5px;">Filter: </span>'));
		});
		
		// Create 'Add Todo' button
		$add_todo_btn = $('<a href="#" id="add-todo-btn" class="btn btn-success btn-xs pull-right">Add Todo</a>');
		$add_todo_btn.click(this.add_todo.bind(this));
		$title_bar.append($add_todo_btn);
		
		this.reload_todolist();
		
		
		
		this.$add_todo_modal = $(
			'<form id="add-todo-modal" class="modal fade" tabindex="-1" role="dialog">' +
			'  <div class="modal-dialog">' +
			'    <div class="modal-content">' +
			'      <div class="modal-header">' +
			'        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
			'        <h4 class="modal-title">Add To Do Item</h4>' +
			'      </div>' +
			'      <div class="modal-body">' +
			'        <div class="form-group">' +
			'		 	<input id="add-todo-title" class="form-control" type="text">' +
			'		 </div>' +
			'        <div class="form-group">' +
			'			<label class="pull-left">Priority:</label>' +
			'		 	<input id="add-todo-priority" class="form-control" type="number">' +
			'		 </div>' +
			'      </div>' +
			'      <div class="modal-footer">' +
			'        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
			'      </div>' +
			'    </div>' +
			'  </div>' +
			'</form>'
		);
		this.$add_todo_modal.hide();
		$('body').append(this.$add_todo_modal);
		
		this.labels.then(function(labels) {
			var $buttons = $('<div class="form-group btn-group" data-toggle="buttons-radio"></div>');
				
			$.each(labels, function(label_i, label) {
				$label = $('<a href="#" class="btn btn-todo-label" style="background-color:#' + label.color + ' !important;">' + label.name + '</a>');
				
				$label.click(function() {
					$buttons.find('a').removeClass('selected');
					$(this).addClass('selected');
					
					return false;
				});
				
				$buttons.append($label);
			});
			self.$add_todo_modal.find('.modal-body').append($buttons);
		});
		
		$submit = $('<button type="button" class="btn btn-primary">Save</button>');
		this.$add_todo_modal.find('.modal-footer').append($submit);
		
		$submit.click(function() {
			var title = $('#add-todo-title').val();
			var priority = $('#add-todo-priority').val();
			
			$.when ( self._storage.saveObject({
				priority: priority,
				title: title
			}, [self.$add_todo_modal.find('a.btn-todo-label.selected').text()]) ).then(self.reload_todolist.bind(self));
			
			self.$add_todo_modal.modal('hide');
		});
		
		this.$add_todo_modal.on('shown.bs.modal', function () {
			self.$add_todo_modal.find('#add-todo-title').focus();
		});
    };
	
	Plugin.prototype.add_todo = function() {
		this.$add_todo_modal.find('input').val('');
		this.$add_todo_modal.modal();
	};
	
	Plugin.prototype.reload_todolist = function() {
		var self = this;
		
		$.when ( self._storage.objects(self.filter_labels(), 'or') ).then(function(objects) {
			objects.sort(function (a, b) { return a.json.priority - b.json.priority });
			
			self.element.empty();
			
			$.each(objects, function(object_i, object) {
				var todo = object.json;
				
				var $todo = $(
					'<div class="col-xs-6">' +
						'<div class="alert alert-small">' +	todo.title +	'</div>' +
					'</div>'
				);
				$todo.hide();
				self.element.append($todo);
				
				$todo = $todo.find('.alert');
				$todo.css({
					color: '#fff',
					'background-color': '#' +  (object.labels.length > 0 ? object.labels[0].color : '000'),
				});
				
				$todo.append($(' <span class="badge">' + todo.priority + '</span>'));
			
				var $delete = $('<button class="close" type="button">×</button>');
				$todo.prepend($delete);
				
				(function(object, $todo) {
					$delete.click(function() {
						$.when ( self._storage.removeObject(object.id) ).then($todo.parent().fadeOut(300, $todo.parent().remove));
					});
				})(object, $todo);
				
				$todo.parent().fadeIn(300);
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

