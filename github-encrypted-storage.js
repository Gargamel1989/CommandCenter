/**
 *
 *
**/
/*!
 * jQuery lightweight plugin boilerplate
 * Original author: @ajpiano
 * Further changes, comments: @addyosmani
 * Licensed under the MIT license
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
    var pluginName = 'githubEncryptedStorage',
        defaults = {
			encryption_passphrase: null,
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
        if (!this.options.github_username) {
			throw 'githubEncryptedStorage requires the github_username option';
		}
		if (!this.options.github_password) {
			throw 'githubEncryptedStorage requires the github_password option';
		}
		if (!this.options.github_repo) {
			throw 'githubEncryptedStorage requires the github_repo option';
		}
		
		this._github_repos_url = 'https://api.github.com/repos/' + this.options.github_username + '/' + this.options.github_repo;

		this._labels = null;
		this._labelsLoaded = false;
    };
    
    Plugin.prototype.decrypt = function (cypher_text) {
    	var stringified = cypher_text;
    	
    	if (this.options.encryption_passphrase) {
    		var decrypted = CryptoJS.AES.decrypt(cypher_text, this.options.encryption_passphrase);
			
			var stringified = decrypted.toString(CryptoJS.enc.Utf8);
    	}
		
		return JSON.parse(stringified);
    }
    
    Plugin.prototype.encrypt = function (json_object) {
    	var stringified = JSON.stringify(json_object);
    	
    	if (!this.options.encryption_passphrase)
    		return stringified;

		var encrypted = CryptoJS.AES.encrypt(stringified, this.options.encryption_passphrase);
		
		return encrypted.toString();
    }
    
    Plugin.prototype.loadLabels = function () {
		this.labelsLoaded = false;
		
		$.ajax({
			url: this._github_repos_url + '/labels',
			method: 'GET'
		}).success(function(data) {
			this._labels = data;
			this._labelsLoaded = true;
		}).error(function(e) {
			console.log(e);
			throw 'Error while connecting to github repo';
		});
    };
    
    Plugin.prototype.labels = function () {
    	if (!this._labelsLoaded) {
    		throw 'Labels have not been loaded yet!';
    	}
    	
    	return this._labels;
    }

    // A really lightweight plugin wrapper around the constructor, 
    // preventing against multiple instantiations
    $[pluginName] = function ( options ) {
        if (!$.data(this, 'plugin_' + pluginName)) {
            $.data(this, 'plugin_' + pluginName, 
            new Plugin( this, options ));
            
            return $.data(this, 'plugin_' + pluginName);
        }
    }

})( jQuery, window, document );



/**
(function ( $ ) {
    $.fn.githubEncryptedStorage = function(options) {
	
		var settings = $.extend({
			github_username: null,
			github_password: null,
			github_repo: null,
			
			encryption_passphrase: null,
		}, options );
		
		if (!settings.github_username) {
			throw 'githubEncryptedStorage requires the github_username option';
		}
		if (!settings.github_password) {
			throw 'githubEncryptedStorage requires the github_password option';
		}
		if (!settings.github_repo) {
			throw 'githubEncryptedStorage requires the github_repo option';
		}
		
		
		
		this.labels = null;
		this.labelsLoaded = false;
		this.loadLabels = function() {
			this.labelsLoaded = false;
			
			$.ajax({
				url: 'https://api.github.com/repos/' + settings.github_username + '/' + settings.github_repo + '/labels',
				method: 'GET'
			}).success(function(data) {
				this.labels = data;
				this.labelsLoaded = true;
			}).error(function(e) {
				throw 'Error while contacting github' + e;
			});
		}
		
		
		
		return this;
	}; 
}( jQuery ));**/