suite('xde', function () {
	var iframe, childXde, postMessage;
	var iframeContent = '<!DOCTYPE html><html><head><script src=\'/base/lib/xde.js?'+new Date().getTime()+'\'></script><script>parent.setChildXde(xde);</script></head><body>test</body></html>';

	function asyncDone(fn, done) {
		return function () {
			try {
				fn.apply(this, arguments);
				done();
			} catch (e) {
				done(e);
			}
		};
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
			var eventName = 'foo',
				eventData = 'abc' + new Date().getTime();
			childXde.on(eventName, asyncDone(function (evt) {
				assert.defined(evt);
				assert.equals(evt.name, eventName);
				assert.equals(evt.data, eventData);
			}, done));

			xde.sendTo(iframe, eventName, eventData);
		});

		test('should not throw exception on non-JSON message events', function (done) {
			var spy = sinon.spy();
			iframe.contentWindow.onerror = spy;
			iframe.contentWindow.postMessage('not serialized JSON', '*');

			setTimeout(asyncDone(function () {
				sinon.assert.notCalled(spy);
			}, done), 50);
		});
	});
});