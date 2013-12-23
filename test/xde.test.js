suite('xde', function () {
	var iframe, childXde, postMessage;
	var miniEvtListener = function (el, n, m, u) {el.addEventListener(n, m, u);};
	var iframeContent = '<!DOCTYPE html><html><head><script>var eventListener={add:'+miniEvtListener.toString()+'};</script><script src=\'/base/lib/xde.js?'+new Date().getTime()+'\'></script><script>parent.setChildXde(xde);</script></head><body>test</body></html>';

	function async(fn, done) {
		return function () {
			try {
				fn.apply(this, arguments);
				done();
			} catch (e) {
				done(e);
			}
		};
	}

	function dispatchMessageEvt (msg, origin, source) {
		var evt;
		try {
			evt = new MessageEvent('message', {data: msg, origin: origin, source: source});
		} catch (e) {
			evt = document.createEvent('MessageEvent');
			evt.initMessageEvent('message', true, true, msg, origin, 1, source);
		}
		window.dispatchEvent(evt);
	}
	
	setup(function (done) {
		window.setChildXde = function (xde) {
			window.setChildXde = null;
			childXde = xde;
			done();
		};

		iframe = document.createElement('iframe');
		document.body.appendChild(iframe);
		var doc = iframe.contentWindow.document;
		doc.open('text/html', 'replace');
		doc.write(iframeContent);
		doc.close();
		postMessage = sinon.spy(iframe.contentWindow, 'postMessage');
	});

	teardown(function teardown () {
		document.body.removeChild(iframe);
		childXde = undefined;
		postMessage.restore();
		xde._reset();
	});

	suite('on', function() {
		test('should be defined', function () {
			assert.defined(xde.on);
		});

		test('should throw if event name is not given', function () {
			assert.exception(function () {
				xde.on();
			});
		});

		test('should throw if event name is empty string', function () {
			assert.exception(function () {
				xde.on('');
			});
		});

		test('should throw if callback is not a function', function () {
			assert.exception(function () {
				xde.on('test');
			});
		});

		test('should not throw when calling with right arguments', function () {
			refute.exception(function () {
				xde.on('test', function () {});
			});
		});

		test('should not trigger listener sync', function () {
			var eventName = 'foo',
				eventData = 'bar',
				spy = sinon.spy();

			xde.on(eventName, spy);
			sinon.assert.notCalled(spy);
		});

		test('should not use JSON.parse when message data is an object', function () {
			var spy = sinon.spy(JSON, "parse");
			dispatchMessageEvt({foo: 'bar'});
			sinon.assert.notCalled(spy);
			spy.restore();
		});

		test('should try JSON.parse when message data is a string', function () {
			var spy = sinon.spy(JSON, "parse");
			dispatchMessageEvt('{"foo":"bar"}');
			sinon.assert.calledOnce(spy);
			spy.restore();
		});

		test('should pass source and origin to the event object', function (done) {
			var source = window;
			var origin = location.href;
			
			xde.on('test', function (evt) {
				assert.equals(source, evt.source);
				assert.equals(origin, evt.origin);
				done();
			});
			dispatchMessageEvt({
				__xde: true,
				name: 'test'
			}, origin, source);
		});
	});

	suite('sendTo', function() {
		test('should throw if otherWindow is not valid postMessage target', function () {
			assert.exception(function () {
				xde.sendTo('test', 'name');
			});
		});

		test('should not throw when calling with iframe as otherWindow', function () {
			refute.exception(function () {
				xde.sendTo(iframe, 'test');
			});
		});

		test('should not throw when calling with window.top as otherWindow', function () {
			refute.exception(function () {
				childXde.sendTo(window, 'test');
			});
		});

		test('should throw if event name is not given', function () {
			assert.exception(function(){
				xde.sendTo(iframe);
			});
		});

		test('should throw if event name is empty string', function () {
			assert.exception(function () {
				xde.sendTo(iframe, '');
			});
		});

		test('should call postMessage only once', function () {
			xde.sendTo(iframe, 'test');
			assert(postMessage.calledOnce);
		});

		test('should trigger listener on the other side', function (done) {
			var eventName = 'foo';
			childXde.on(eventName, async(function (evt) {
				assert.defined(evt);
				assert.equals(evt.name, eventName);
			}, done));

			xde.sendTo(iframe, eventName);
		});

		test('should send event data to the listener', function (done) {
			var eventName = 'foo',
				eventData = {
					time: new Date().getTime(),
					str: 'abc'
				};
			childXde.on(eventName, async(function (evt) {
				assert.equals(evt.data, eventData);
			}, done));

			xde.sendTo(iframe, eventName, eventData);
		});

		test('should not throw exception on non-JSON message events', function (done) {
			var spy = sinon.spy();
			iframe.contentWindow.onerror = spy;
			iframe.contentWindow.postMessage('not serialized JSON', '*');

			setTimeout(async(function () {
				sinon.assert.notCalled(spy);
			}, done), 50);
		});

		test('should ignore json messages not sent by xde', function (done) {
			var spy = sinon.spy();
			var data = {data : 'foo', name : 'bar'};
			childXde.on(data.name, spy);
			iframe.contentWindow.postMessage(JSON.stringify(data), '*');

			setTimeout(async(function () {
				sinon.assert.notCalled(spy);
			}, done), 50);
		});

		test('should allow multiple listeners for same event name', function (done) {
			var spy1 = sinon.spy(), spy2 = sinon.spy();
			var evtName = 'multiple';
			childXde.on(evtName, spy1);
			childXde.on(evtName, spy2);
			xde.sendTo(iframe, evtName);
			
			setTimeout(async(function () {
				sinon.assert.calledOnce(spy1);
				sinon.assert.calledOnce(spy2);
			}, done), 50);
		});

		test('should only trigger listeners for the sent event name', function (done) {
			var spy1 = sinon.spy(), spy2 = sinon.spy();
			var evtName1 = 'foo';
			var evtName2 = 'bar';
			childXde.on(evtName1, spy1);
			childXde.on(evtName2, spy2);
			xde.sendTo(iframe, evtName1);
			
			setTimeout(async(function () {
				sinon.assert.calledOnce(spy1);
				sinon.assert.notCalled(spy2);
			}, done), 50);	
		});

		test('should not throw error or call any callbacks if no listners for an event name', function (done) {
			var spy = sinon.spy();
			iframe.contentWindow.onerror = spy;
			
			childXde.on('foo', spy);
			xde.sendTo(iframe, 'bar');
			setTimeout(async(function () {
				sinon.assert.notCalled(spy);
			}, done), 50);
		});

		test('should not stringify to JSON when browser supports postMessage with objects', function () {
			var spy = sinon.spy(JSON, 'stringify');
			xde.sendTo(iframe, 'test', {a: 1});
			sinon.assert.notCalled(spy);
			spy.restore();
		});

		test('should stringify to JSON when browser doesn\'t support postMessage with objects', function () {
			xde._reset(true);
			var spy = sinon.spy(JSON, 'stringify');
			xde.sendTo(iframe, 'test', {a: 1});
			sinon.assert.calledOnce(spy);
			spy.restore();
		});
	});

	suite('off', function () {
		test('should not throw exception when no listeners for given event name', function () {
			refute.exception(function () {
				xde.off('foo', function () {});
			});
		});

		test('should remove listener for given event name', function (done) {
			var spy = sinon.spy();
			var eventName = 'foo';

			childXde.on(eventName, spy);
			childXde.off(eventName, spy);

			xde.sendTo(iframe, eventName);
			setTimeout(async(function () {
				sinon.assert.notCalled(spy);
			}, done), 50);
		});

		test('should only remove the given listener on a particular event name', function (done) {
			var spy1 = sinon.spy(), spy2 = sinon.spy();
			var eventName = 'foo';

			childXde.on(eventName, spy1);
			childXde.on(eventName, spy2);

			childXde.off(eventName, spy1);

			xde.sendTo(iframe, eventName);

			setTimeout(async(function () {
				sinon.assert.calledOnce(spy2);
				sinon.assert.notCalled(spy1);
			}, done), 50);	

		});
	});

	suite('targetOrigin', function () {
		test('should pass * targetOrigin to postMessage as default', function () {
			xde.sendTo(iframe, 'test');
			assert.equals(postMessage.getCall(0).args[1], '*');
		});

		test('should pass specified targetOrigin to postMessage', function () {
			var TARGET_ORIGIN = 'http://test.com';
			xde.targetOrigin = TARGET_ORIGIN;
			xde.sendTo(iframe, 'test');
			assert.equals(postMessage.getCall(0).args[1], TARGET_ORIGIN);
		});

		test('should ignore messages from unknown origins', function (done) {
			var TARGET_ORIGIN = 'http://test.com';
			var EVENT_NAME = 'test';
			var spy = sinon.spy();
			childXde.targetOrigin = TARGET_ORIGIN;
			childXde.on(EVENT_NAME, spy);
			xde.sendTo(iframe, EVENT_NAME);

			setTimeout(async(function() {
				refute.called(spy);
			}, done), 50);
		});
	});
});