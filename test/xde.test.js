function cleanupSpy(){
    if (this.spy) {
        this.spy.restore();
        this.spy = null;
    }
}

describe('xde', function () {
    var iframeElem;
    var iframeWindow;

    function async(fn, done) {
        return function () {
            try {
                fn.apply(this, arguments);
                done();
            } catch (e) {
                console.error(e);
                done(e);
            }
        };
    }

    function asyncAssert(fn, done) {
        return setTimeout(async(fn, done), 50);
    }

    function sendPostMessage(data, cb) {
        var name = data.name || 'test';
        if (cb) {
            window.xde.on(name, cb);
        }
        iframeWindow.xde.sendTo(window, name, data);
    }

    beforeEach(function (done) {
        this.timeout(20000); // saucelabs may need more time to load the iframe
        window.initXde = function (_win) {
            iframeWindow = _win.window; //accessing window.window for IE8
            done();
        };
        iframeElem = document.createElement('iframe');
        iframeElem.width = '300px';
        iframeElem.height = '100px';
        iframeElem.style.width = '300px';
        iframeElem.style.height = '100px';
        iframeElem.style.backgroundColor = 'red';
        document.body.appendChild(iframeElem);
        iframeElem.src  = '/base/test/fixtures/childIframe.html?' + (+new Date());
    });

    afterEach(function teardown () {
        iframeWindow = null;
        window.xde._reset();
        document.body.removeChild(iframeElem);
        cleanupSpy.call(this);
    });

    describe('on', function() {
        it('should be defined', function () {
            assert.defined(xde.on);
        });

        it('should throw if event name is not given', function () {
            assert.exception(function () {
                xde.on();
            });
        });

        it('should throw if event name is empty string', function () {
            assert.exception(function () {
                xde.on('');
            });
        });

        it('should throw if callback is not a function', function () {
            assert.exception(function () {
                xde.on('test');
            });
        });

        it('should not throw when calling with right arguments', function () {
            refute.exception(function () {
                xde.on('test', function () {});
            });
        });

        it('should not trigger listener sync', function () {
            var eventName = 'foo';
            var eventData = 'bar';
            var spy = sinon.spy();

            xde.on(eventName, spy);
            sinon.assert.notCalled(spy);
        });

        // add if

        // cleanup somewhere missing
        it('should not use JSON.parse when message data is an object', function (done) {
            var spy = wrapAndSpy(JSON, "parse");

            sendPostMessage({foo: 'bar'}, function() {
                if (xde.onlyStringSupport === false) {
                    assert.equals(spy.callCount, 0, 'JSON parse should NOT be called');
                } else {
                    assert.equals(spy.callCount, 1, 'JSON parse should be called when string');
                }
                spy.restore();
                done();
            });
        });


        it('should try JSON.parse when message data is a string', function (done) {
            var spy = wrapAndSpy(JSON, "parse");
            var orig = iframeWindow.xde.onlyStringSupport;

            iframeWindow.xde.onlyStringSupport = true;

            sendPostMessage({"foo":"bar"}, function() {
                iframeWindow.xde.onlyStringSupport = orig;
                assert.equals(spy.callCount, 1, 'JSON parse should be called');
                spy.restore();
                done();
            });
        });

        it('should pass source and origin to the event object', function (done) {
            var origin = 'http://'+iframeWindow.location.host;

            xde.on('test', function (evt) {
                assert.equals(evt.origin, origin);
                assert.equals(evt.source, iframeWindow);
                done();
            });

            sendPostMessage({});
        });
    });

    describe('sendTo', function() {
        it('should throw if otherWindow is not valid postMessage target', function () {
            assert.exception(function () {
                xde.sendTo('test', 'name');
            });
        });

        it('should not throw when calling with iframeElem as otherWindow', function () {
            refute.exception(function () {
                xde.sendTo(iframeWindow, 'test');
            });
        });

        it('should not throw when calling with window.top as otherWindow', function () {
            refute.exception(function () {
                iframeWindow.xde.sendTo(window, 'test');
            });
        });

        it('should throw if event name is not given', function () {
            assert.exception(function(){
                xde.sendTo(iframeWindow);
            });
        });

        it('should throw if event name is empty string', function () {
            assert.exception(function () {
                xde.sendTo(iframeWindow, '');
            });
        });

        it('should call postMessage only once', function (done) {

            var spy = wrapAndSpy(window, 'postMessage');

            assert.equals(iframeWindow.spy.callCount, 0);

            window.xde.on('test321', function() {
                spy.restore();
                assert.equals(iframeWindow.spy.callCount, 0, 'iframeSpy should not be called');
                assert.equals(spy.callCount, 1);
                done();
            });

            iframeWindow.xde.sendTo(window, 'test321', {payload: 'asd'});

        });

        it('should trigger listener on the other side', function (done) {
            var eventName = 'foo';
            iframeWindow.xde.on(eventName, async(function (evt) {
                assert.defined(evt);
                assert.equals(evt.name, eventName);
            }, done));

            xde.sendTo(iframeWindow, eventName);
        });

        it('should send event data to the listener', function (done) {
            var eventName = 'foo',
                eventData = {
                    time: new Date().getTime(),
                    str: 'abc'
                };
                iframeWindow.xde.on(eventName, async(function (evt) {
                assert.equals(evt.data, eventData);
            }, done));

            xde.sendTo(iframeWindow, eventName, eventData);
        });

        it('should not throw exception on non-JSON message events', function (done) {
            var spy = sinon.spy();
            iframeWindow.onerror = spy;
            iframeWindow.postMessage('not serialized JSON', '*');

            asyncAssert(function () {
                sinon.assert.notCalled(spy);
            }, done);
        });

        it('should ignore json messages not sent by xde', function (done) {
            var spy = sinon.spy();
            var data = {data : 'foo', name : 'bar'};
            iframeWindow.xde.on(data.name, spy);
            iframeWindow.postMessage(JSON.stringify(data), '*');

            asyncAssert(function () {
                sinon.assert.notCalled(spy);
            }, done);
        });

        it('should allow multiple listeners for same event name', function (done) {
            var spy1 = sinon.spy(), spy2 = sinon.spy();
            var evtName = 'multiple';
            iframeWindow.xde.on(evtName, spy1);
            iframeWindow.xde.on(evtName, spy2);
            xde.sendTo(iframeWindow, evtName);

            asyncAssert(function () {
                sinon.assert.calledOnce(spy1);
                sinon.assert.calledOnce(spy2);
            }, done);
        });

        it('should only trigger listeners for the sent event name', function (done) {
            var spy1 = sinon.spy(), spy2 = sinon.spy();
            var evtName1 = 'foo';
            var evtName2 = 'bar';
            iframeWindow.xde.on(evtName1, spy1);
            iframeWindow.xde.on(evtName2, spy2);
            xde.sendTo(iframeWindow, evtName1);

            asyncAssert(function () {
                sinon.assert.calledOnce(spy1);
                sinon.assert.notCalled(spy2);
            }, done);
        });

        it('should not throw error or call any callbacks if no listners for an event name', function (done) {
            var spy = sinon.spy();
            iframeWindow.onerror = spy;

            iframeWindow.xde.on('foo', spy);
            xde.sendTo(iframeWindow, 'bar');
            asyncAssert(function () {
                sinon.assert.notCalled(spy);
            }, done);
        });

        if (xde.onlyStringSupport === false) {
            after(cleanupSpy);

            it('should not stringify to JSON when browser supports postMessage with objects', function () {
                var spy = sinon.spy(JSON, 'stringify');
                xde.sendTo(iframeWindow, 'test', {a: 1});
                sinon.assert.notCalled(spy);
            });
        }

        if (xde.onlyStringSupport === true) {
            after(cleanupSpy);
            it('should stringify to JSON when browser doesn\'t support postMessage with objects', function () {
                var spy = this.spy = sinon.spy(JSON, 'stringify');
                xde.sendTo(iframeWindow, 'test', {a: 1});
                sinon.assert.calledOnce(spy);
            });
        }

    });

    describe('off', function () {
        it('should not throw exception when no listeners for given event name', function () {
            refute.exception(function () {
                xde.off('foo', function () {});
            });
        });

        it('should remove listener for given event name', function (done) {
            var spy = sinon.spy();
            var eventName = 'foo';

            iframeWindow.xde.on(eventName, spy);
            iframeWindow.xde.off(eventName, spy);

            xde.sendTo(iframeWindow, eventName);
            asyncAssert(function () {
                sinon.assert.notCalled(spy);
            }, done);
        });

        it('should only remove the given listener on a particular event name', function (done) {
            var spy1 = sinon.spy();
            var spy2 = sinon.spy();
            var eventName = 'foo';

            iframeWindow.xde.on(eventName, spy1);
            iframeWindow.xde.on(eventName, spy2);

            iframeWindow.xde.off(eventName, spy1);

            xde.sendTo(iframeWindow, eventName);

            asyncAssert(function () {
                sinon.assert.calledOnce(spy2);
                sinon.assert.notCalled(spy1);
            }, done);

        });
    });

    describe('targetOrigin', function () {
        it('should pass * targetOrigin to postMessage as default', function () {
            xde.sendTo(iframeWindow, 'test');
            assert.equals(iframeWindow.spy.getCall(0).args[1], '*');
        });

        before(cleanupSpy);
        after(cleanupSpy);

        it('should pass specified targetOrigin to postMessage', function (done) {
            var spy = this.spy = wrapAndSpy(window, 'postMessage');

            iframeWindow.xde.targetOrigin = 'http://test.com';
            iframeWindow.xde.sendTo(window, 'test', {payload: Math.random()});

            asyncAssert(function(){
                iframeWindow.xde.targetOrigin = '*';
                assert.equals(spy.callCount, 1);
                assert.equals(spy.getCall(0).args[1], 'http://test.com');
                spy.restore();
            }, done);

        });

        it('should ignore messages from unknown origins', function (done) {
            var TARGET_ORIGIN = 'http://test.com';
            var EVENT_NAME = 'test';
            var spy = sinon.spy();

            iframeWindow.xde.targetOrigin = TARGET_ORIGIN;
            iframeWindow.xde.on(EVENT_NAME, spy);
            xde.sendTo(iframeWindow, EVENT_NAME);

            asyncAssert(function() {
                refute.called(spy);
            }, done);
        });
    });
});
