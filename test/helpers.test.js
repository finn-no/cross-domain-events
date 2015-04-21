
describe('wrapAndSpy', function() {

    it('should just spy', function() {

        var spy = wrapAndSpy();

        assert(!spy.called, 'should not called');

        spy();

        assert(spy.called, 'should have called');

        assert.equals(spy.callCount, 1);

        spy();
        spy();
        spy();

        assert.equals(spy.callCount, 4);
    });

    it('should pass to original method', function() {

        var originalCalled = 0;
        var original = {
            method: function method() {
                originalCalled++;
            }
        };
        var _method = original.method;

        assert(_method === original.method, 'should be same');

        var spy = wrapAndSpy(original, 'method');

        assert(_method !== original.method, 'should be replaced');

        assert(!spy.called);

        spy(1);

        assert.equals(spy.callCount, 1);

        original.method();

        assert.equals(spy.callCount, 2);
        assert.equals(originalCalled, 1, 'original method should have been called');

        spy.restore();

        original.method();

        assert.equals(spy.callCount, 2);
        assert.equals(originalCalled, 2);
    });

    it('should restore non-writeable props', function() {
        var orig = window.postMessage;

        var spy = wrapAndSpy(window, 'postMessage');

        assert(orig !== window.postMessage);

        spy.restore();

        assert(orig === window.postMessage, 'expected spy to be restored');

    });
});
