(function (win) {
	var leCallback = null, xde;

	function onMessage(evt) {
		console.log('MESSAGE data ' + evt.data);
		var parsedData = JSON.parse(evt.data);

		if (leCallback) {
			leCallback({
				name : parsedData.name,
				data : parsedData.data
			});
		}
	}

	function validateName(name) {
		if (!name || typeof name != 'string') { throw new Error('Event name has to be a string'); };
	}

	xde = {
		on: function (name, fn) {
			validateName(name);
			if( typeof fn != "function" ) { throw new Error('Callback function has to be given'); }

			leCallback = fn;
		},

		sendTo: function (otherWindow, name, data) {
			validateName(name);
			if (otherWindow && otherWindow.contentWindow) {
				otherWindow = otherWindow.contentWindow;
			}
			if ( !otherWindow || typeof otherWindow.postMessage != 'function' ) {
				throw new TypeError('otherWindow does not support postMessage');
			}

			var serializedData = JSON.stringify({
				data : data,
				name : name
			});
			otherWindow.postMessage(serializedData, '*'); // TODO fix security issue
		},

		_reset: function () {
			leCallback = null;
		}
	};

	window.addEventListener('message', onMessage, false);

	if(typeof exports === 'object') {
		module.exports = xde;
	} else {
		win.xde = xde;
	}
})(this);