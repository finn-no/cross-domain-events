(function(win, events) {
    var xde;
    var DEFAULT_ORIGIN = '*';
    var eventListeners = {};

    function onMessage(evt) {
        var parsedData;

        if (xde.targetOrigin != DEFAULT_ORIGIN && evt.origin !== xde.targetOrigin) {
            return;
        }

        parsedData = evt.data;
        if (typeof evt.data == 'string' && evt.data[0] === '{') {
            try {
                parsedData = JSON.parse(evt.data);
            } catch (e) {}
        }

        if (!parsedData || parsedData.__xde !== true) {
            return;
        }

        parsedData.origin = evt.origin;
        parsedData.source = evt.source;

        var listeners = eventListeners[parsedData.name];
        if (listeners && listeners.length > 0) {
            listeners.forEach(function(fn) {
                fn(parsedData);
            });
        }
    }

    function validateName(name) {
        if (!name || typeof name != 'string') {
            throw new Error('Event name has to be a string');
        }
    }

    function validateNameAndFn(name, fn) {
        validateName(name);
        if (typeof fn != 'function') {
            throw new Error('Callback function has to be given');
        }
    }

    xde = {
        on: function(name, fn) {
            validateNameAndFn(name, fn);

            if (typeof eventListeners[name] == 'undefined') {
                eventListeners[name] = [];
            }
            eventListeners[name].push(fn);
        },

        off: function(name, fn) {
            validateNameAndFn(name, fn);
            var listeners = eventListeners[name];
            if (!listeners) {
                return;
            }
            eventListeners[name] = listeners.filter(function(listener) {
                return listener !== fn;
            });
        },

        sendTo: function(otherWindow, name, data) {
            validateName(name);
            try {
                if (otherWindow && otherWindow.contentWindow) {
                    otherWindow = otherWindow.contentWindow;
                }
            } catch (e) {}
            if (!otherWindow || !otherWindow.postMessage) {
                throw new TypeError('otherWindow does not support postMessage');
            }

            var msg = {
                name: name,
                data: data,
                __xde: true
            };
            if (xde.onlyStringSupport) {
                msg = JSON.stringify(msg);
            }
            otherWindow.postMessage(msg, xde.targetOrigin); // TODO fix security issue
        },

        targetOrigin: DEFAULT_ORIGIN,

        onlyStringSupport: false,

        _reset: function() {
            eventListeners = {};
            this.targetOrigin = DEFAULT_ORIGIN;
        }
    };

    function featureTestObjectTransportSupport() {
        try {
            win.postMessage({
                toString: function() {
                    xde.onlyStringSupport = true;
                }
            }, DEFAULT_ORIGIN);
        } catch (e) {}
    }

    featureTestObjectTransportSupport();

    events.add(win, 'message', onMessage, false);

    if (typeof exports === 'object') {
        module.exports = xde;
    } else {
        win.xde = xde;
    }
})(this.window || (typeof global !== 'undefined' ? global : this), this.eventListener || require('eventlistener'));
