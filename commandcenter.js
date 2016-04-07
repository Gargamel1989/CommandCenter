function dashboard(options) {
	
	var settings = $.extend({
		title: "Dashboard",
		
		blocks: [],
	}, options );
	
	document.title = settings.title;
	
	$("body").html(
		'<div class="navbar navbar-default navbar-fixed-top">' +
			'<div class="container">' +
				'<div class="navbar-header">' +
					'<a class="navbar-brand" href="/">' + settings.title + '</a>' +
					'<button class="navbar-toggle" data-target="#navbar-main" data-toggle="collapse" type="button">' +
						'<span class="icon-bar"></span>' +
						'<span class="icon-bar"></span>' +
						'<span class="icon-bar"></span>' +
					'</button>' +
				'</div>' +
			'</div>' +
		'</div>' + 
		'<div id="content" class="container">' +
		'</div>'
	);
	
	var row = $('<div class="row"></div>');
	$("#content").append(row);
	
	for (block in settings.blocks) {
		var b = $.extend({
			name: block,
			type: null,
			
			sizeClass: 'col-xs-12 col-sm -6 col-md-3',
		}, settings.blocks[block]);
		
		var $el = $(
			'<div class="' + b.sizeClass + '">' +
				'<div class="panel panel-default">' +
					'<div class="panel-heading"><strong>' + b.name + '</strong></div>' +
					'<div class="panel-body panel-block">' +
						'<div class="block row">' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>'
		);
		
		row.append($el);
		var $block = $el.find('.block');
		
		if (b.type == 'github_todo') {
			github_todo($block, b);
		} else if (b.type == 'heartbeat')  {
			heartbeat($block, b);
		}
	}
}

var gt_first = true;
		
function persistLabelsFilter() {
	localStorage.setItem('gt-todo-filter-labels', 
						 JSON.stringify($('.btn-label-filter.retain').map(function() { return this.text }).toArray()));
}
		
function github_todo($el, options) {
	
	var settings = $.extend({
		github_username: null,
		github_password: null,
		github_repo: null,
		
		encryption_passphrase: null,
		salt: 'github_todo',
	}, options );
	
	if (!settings.github_username) {
		alert('github_todo plugin requires the github_username option');
	}
	if (!settings.github_password) {
		alert('github_todo plugin requires the github_password option');
	}
	if (!settings.github_repo) {
		alert('github_todo plugin requires the github_repo option');
	}
	
	
	var encrypt_todo = function(priority, text) {
		return priority + '#' + text;
	}
	var decrypt_todo = function(cypher_text) {
		split_i = cypher_text.indexOf('#');
		
		return {
			priority: parseInt(cypher_text.slice(0, split_i)),
			text: cypher_text.slice(split_i + 1)
		};
	}
		
	if (settings.encryption_passphrase) {
		var plain_encrypt_todo = encrypt_todo;
		encrypt_todo = function(priority, text) {
			var plaintext = plain_encrypt_todo(priority, text);
			
			var encrypted = CryptoJS.AES.encrypt(plaintext, settings.encryption_passphrase);
			
			return encrypted.toString();
		}
		
		var plain_decrypt_todo = decrypt_todo;
		decrypt_todo = function(cypher_text) {
			var decrypted = CryptoJS.AES.decrypt(cypher_text, settings.encryption_passphrase);
			
			var plaintext = decrypted.toString(CryptoJS.enc.Utf8);
			return plain_decrypt_todo(plaintext);
		}
	}
	
	var filter_labels = JSON.parse(localStorage.getItem('gt-todo-filter-labels'));
	
	$el.empty();
	
	if (gt_first) {
		var labels = [];
		$.ajax({
			url: 'https://api.github.com/repos/' + settings.github_username + '/' + settings.github_repo + '/labels',
			method: 'GET'
		}).success(function(data) {
			labels = data;
			
			$.each(labels, function(i, label) {
				var $filter_label_btn = 
					$('<a href="#" class="btn btn-xs pull-right btn-label-filter ' + 
					((filter_labels.length == 0 || (filter_labels.indexOf(label.name) >= 0)) ? 'retain' : '') + 
					'" style="color:#fff;background-color: #' +  label.color + ';">' + label.name + '</a>');
				$filter_label_btn.click(function() {
					$(this).toggleClass('retain');
					persistLabelsFilter();
					github_todo($el, options);
					return false;
				});
				$el.parent().parent().find('.panel-heading').append($filter_label_btn);
				
			});
			$el.parent().parent().find('.panel-heading').append($('<span class="pull-right" style="margin-right:5px;">Filter: </span>'));
			
			persistLabelsFilter();
		});
	}
	
	$.ajax({
		url: 'https://api.github.com/repos/' + settings.github_username + '/' + settings.github_repo + '/issues',
		labels: filter_labels,
	}).success(function(data) {
		var todos = data.filter(function(d) { return filter_labels.length == 0 || (d.labels.length > 0 && filter_labels.indexOf(d.labels[0].name) >= 0) }).map(function(d) {
			var obj = decrypt_todo(d.title);
			obj.style = (d.labels.length > 0) ? ' style="color:#fff;background-color: #' +  d.labels[0].color : '';
			obj.number = d.number;
			
			return obj;
		});
		todos.sort(function(a, b) { return a.priority - b.priority; });
		
		$.each(todos, function(todo_i) {
			var todo = todos[todo_i];
			
			var title = todo.text + ' <span class="badge">' + todo.priority + '</span>';
			
			var $delete = $('<button class="close" type="button">×</button>');
			var $todo = $(
				'<div class="col-xs-6"><div class="alert alert-small"' + todo.style + ' !important;">' +
					title +
				'</div></div>'
			);
			$todo.find('.alert').prepend($delete);
			$todo.hide();
			
			$el.append($todo);
			
			$delete.click(function() {
				$.ajax({
					url: 'https://api.github.com/repos/' + settings.github_username + '/' + settings.github_repo + '/issues/' + todo.number,
					method: 'PATCH',
					headers: { Authorization: "Basic " + btoa(settings.github_username + ':' + settings.github_password) },
					data: JSON.stringify({
						state: 'closed',
					}),
					contentType:"application/json"
				}).success(function(data) {
					$todo.remove();
				});
			});
			
			$todo.fadeIn(300);
		});
	}).error(function(data) {
		var $alert = $(
			'<div class="alert alert-danger">' +
				'<strong>Error while contacting Github API:</strong><br><br>' +
				data.status + ' - ' + data.statusText +
			'</div>'
		);
		$alert.hide();
		
		$el.append($alert);
		$alert.fadeIn(300);
	});
	
	if (gt_first) {
		$add_todo_btn = $('<a href="#" id="add-todo-btn" class="btn btn-success btn-xs pull-right">Add Todo</a>');
		$el.parent().parent().find('.panel-heading').append($add_todo_btn);
		gt_first = false;
	
		$add_todo_btn.click(function() {
			
			$add_todo_modal = $("#add-todo-modal");
			
			if (!$add_todo_modal.length) {
				$add_todo_modal = $(
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
				$add_todo_modal.hide();
				
				var $buttons = $('<div class="form-group btn-group" data-toggle="buttons-radio"></div>');
					
				for (label_i in labels) {
					var label = labels[label_i];
					
					$buttons.append($('<a href="#" class="btn btn-todo-label" style="background-color:#' + label.color + ' !important;">' + label.name + '</a>'));
				}
				$buttons.find('a').each(function() {
					$(this).click(function() {
						$buttons.find('a').removeClass('selected');
						$(this).addClass('selected');
					});
				});
				$add_todo_modal.find('.modal-body').append($buttons);
				
				$submit = $('<button type="button" class="btn btn-primary">Save</button>');
				$add_todo_modal.find('.modal-footer').append($submit);
				
				$submit.click(function() {
					var title = $('#add-todo-title').val();
					var priority = $('#add-todo-priority').val();
					
					$.ajax({
						url: 'https://api.github.com/repos/' + settings.github_username + '/' + settings.github_repo + '/issues',
						method: 'POST',
						headers: { Authorization: "Basic " + btoa(settings.github_username + ':' + settings.github_password) },
						data: JSON.stringify({
							title: encrypt_todo(priority, $('#add-todo-title').val()),
							labels: [$('#add-todo-modal').find('a.btn-todo-label.selected').text],
							assignee: settings.github_username,
						}),
						contentType:"application/json"
					}).success(function(data) {
						github_todo($el, options);
					});
					
					$add_todo_modal.modal('hide');
				});
				
				$('body').append($add_todo_modal);
				
				$add_todo_modal.on('shown.bs.modal', function () {
					$('#add-todo-title').focus();
				})
			}
			
			$add_todo_modal.find('input').val('');
			$add_todo_modal.modal();
		});
	}
}


function heartbeat($el, options) {
	
	var settings = $.extend({
		sites: [],
	}, options );
	
	for (site_i in settings.sites) {
		var site = settings.sites[site_i];
		
		var $alert = $('<div class="col-xs-12"><div class="alert alert-info alert-small">' + site + '</div></div>');
		$el.append($alert);
		$alert = $alert.find('.alert');
		
		var time = $.now();
		
		(function($alert, time) {
			$.ajax({
				dataType: 'jsonp',
				  data: 'id=10',
				  jsonp: '',
				  url: site,
			}).always(function(data) {
				
				$alert.removeClass('alert-info');
				if (data.status == 200) {
					$alert.addClass('alert-success');
					time = $.now() - time;
					
					$alert.append($('<span class="pull-right">' + time + 'ms</span>'));
				} else {
					$alert.addClass('alert-error');
				}
			});
		})($alert, time);
	}
}
