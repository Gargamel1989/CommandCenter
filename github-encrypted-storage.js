/**
 *
 *
**/
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
}( jQuery ));