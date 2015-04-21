module.exports = function(config) {
    var settings = {
        basePath: '',
        frameworks: ['mocha', 'es5-shim', 'sinon', 'referee'],
        plugins: ['karma-*'],
        files: [{
                pattern: 'test/fixtures/childIframe.html',
                included: false,
                served: true
            },
            'node_modules/eventlistener/eventlistener.js',
            'test/helpers/helpers.js',
            'lib/xde.js',
            'test/*.test.js'
        ],
        browsers: ['PhantomJS'],
        singleRun: false,
        autoWatch: true,
        client: {
            captureConsole: true,
            mocha: {
                ui: 'bdd'
            }
        }
    };

    if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
        settings.reporters = ['progress'];
        settings.browsers = ['PhantomJS'];
    } else {
        settings.browserDisconnectTimeout = 60000 * 2;
        settings.browserNoActivityTimeout = 60000 * 2;
        //settings.browserDisconnectTolerance = 1;
        settings.captureTimeout = 60000 * 3;
        settings.sauceLabs = {
            testName: 'XDE',
            tags: ['xde']
        };
        settings.reporters = ['dots', 'saucelabs'];
        settings.customLaunchers = {};

        // only 3 vmms / browsers per run because of
        // https://github.com/karma-runner/karma-sauce-launcher/issues/40
        // should either add better setup for running max currently or
        var key = process.env.BROWSER_TYPE;
        var target = require('./ci-browsers.js')[key];
        if (!target) {
            console.error('Missing / Unknown BROWSER_TYPE ' + process.env.BROWSER_TYPE);
            process.exit(1);
        }

        Object.keys(target).forEach(function(key){
            settings.customLaunchers[key] = target[key];
        });

        console.log('Running CI tests on', Object.keys(settings.customLaunchers).join(', '));
        settings.browsers = Object.keys(settings.customLaunchers);
    }

    config.set(settings);
};
