(function (win) {
	var DEFAULT_ORIGIN = '*';
	var xde, eventListeners;

	function onMessage(evt) {
		var parsedData;

		if (xde.targetOrigin != DEFAULT_ORIGIN && evt.origin !== xde.targetOrigin) {
			return;
		}

		try {
			parsedData = JSON.parse(evt.data);
		} catch (e) {}
		
		if (!parsedData || parsedData.__xde !== true) {
			return;
		}

		var listeners = eventListeners[parsedData.name];
		if (listeners && listeners.length > 0) {
			listeners.forEach(function(fn){
				fn(parsedData);
			});
		}
	}

	function validateName (name) {
		if (!name || typeof name != 'string') { throw new Error('Event name has to be a string'); };
	}

	function validateNameAndFn (name, fn) {
		validateName(name);
		if (typeof fn != "function" ) { throw new Error('Callback function has to be given'); }
	}

	xde = {
		on: function (name, fn) {
			validateNameAndFn(name, fn);

			if (typeof eventListeners[name] == 'undefined') {
				eventListeners[name] = [];
			}
			eventListeners[name].push(fn);
		},

		off: function (name, fn) {
			validateNameAndFn(name, fn);
			var listeners = eventListeners[name];
			if (!listeners) {
				return;
			}
			eventListeners[name] = listeners.filter(function (listener) {
				return listener !== fn;
			});
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
				name : name,
				data : data,
				__xde : true
			});
			otherWindow.postMessage(serializedData, this.targetOrigin); // TODO fix security issue
		},

		targetOrigin: DEFAULT_ORIGIN,

		_reset: function () {
			eventListeners = {};
			this.targetOrigin = DEFAULT_ORIGIN;
		}
	};

	xde._reset();
	window.addEventListener('message', onMessage, false);

	if(typeof exports === 'object') {
		module.exports = xde;
	} else {
		win.xde = xde;
	}
})(this);