(function(){
    var has = Object.prototype.hasOwnProperty;

    var oldBrowser = false;
    try {
        getPropertyDescriptor({}, 'prop');
    } catch(e) {
        oldBrowser = true;
    }

    function mirrorProperties(target, source) {
        for (var prop in source) {
            // set writable true for IE9 +
            if (!has.call(target, prop)) {
                if (prop !== 'writable') {
                    target[prop] = source[prop];
                } else {
                    target.writable = true;
                }
            }
        }
    }

    function getPropertyDescriptor(object, property) {
        var proto = object;
        var descriptor;
        while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, property))) {
            proto = Object.getPrototypeOf(proto);
        }
        return descriptor;
    }

    // partly copied from sinon.js, bit sinon.js did not work with native non-function functions, e.g. postMessage in IE8
    function wrap(obj, prop, method) {
        var owned = obj.hasOwnProperty ? obj.hasOwnProperty(prop) : has.call(obj, prop);

        var methodDesc = (typeof method == "function") ? {value: method} : method;
        var orig = obj[prop];
        var wrappedMethodDesc = getPropertyDescriptor(obj, prop);
        var i;

        var types = Object.keys(methodDesc);
        for (i = 0; i < types.length; i++) {
            wrappedMethod = wrappedMethodDesc[types[i]];
        }

        mirrorProperties(methodDesc, wrappedMethodDesc);
        for (i = 0; i < types.length; i++) {
            mirrorProperties(methodDesc[types[i]], wrappedMethodDesc[types[i]]);
        }

        Object.defineProperty(obj, prop, methodDesc);

        return function restoreOriginal() {
            if (!owned) {
                try {
                    delete obj[prop];
                } catch (e) {
                }

                if (obj[prop] === method) {
                    obj[prop] = orig;
                }
            } else {
                Object.defineProperty(obj, prop, wrappedMethodDesc);
            }

        };
    }

    window.wrapAndSpy = function wrapAndSpy(obj, prop) {
        function spy() {
            spy.callCount++;
            spy.called = true;
            spy.calls.push(Array.prototype.slice.call(arguments));
        }

        spy.callCount = 0;
        spy.called = false;
        spy.calls = [];
        spy.getCall = function getCall(i) {
            return {
                args: spy.calls[i]
            };
        };
        spy.reset = function() {
            spy.callCount = 0;
            spy.called = false;
            spy.calls = [];
        };

        if (!obj) {
            // simple spy
            return spy;
        }

        var orig = obj[prop];

        if (!orig) {
            throw new Error('Nothing to shim/spy/wrap on ' + prop);
        }

        if (orig && orig.__isSpy) {
            throw new Error(prop + ' is already wrapped');
        }

        function wrappedMethod(a, b, c, d, e, f) {
            spy.callCount ++;
            spy.called = true;

            var args = Array.prototype.slice.call(arguments);
            spy.calls.push(args);
            var res;
            if (!orig.apply) {
                // IE8 function that is NOT a Function class
                res = orig(a, b, c, d, e, f);
            } else {
                res = orig.apply(this, args);
            }

            return res;
        }

        wrappedMethod.__isSpy = true;

        if (!oldBrowser) {
            spy.restore = wrap(obj, prop, wrappedMethod);
        } else {
            obj[prop] = wrappedMethod;
            spy.restore = function restoreOriginalLegacy() {
                obj[prop] = orig;
            };
        }


        return spy;
    };

})();
