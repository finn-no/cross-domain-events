function add(b, p, ver, device) {
    return {
        base: 'SauceLabs',
        browserName: b,
        platform: p,
        version: ver,
        deviceName: device
    };
}

var browsers = {
    'android': {
        'android_4': add('android', 'Linux', '4.1', 'Android Emulator'),
        'android_4-4': add('android', 'Linux', '4.4', 'Android Emulator')
    },
    'ios': {
        'ios_safari_7-1': add('iphone', 'OS X 10.9', '7.1', 'iPhone Simulator'),
        'ios_safari_8-2': add('iphone', 'OS X 10.10', '8.2', 'iPhone Simulator')
    },
    'chrome': {
        'chrome_41': add('chrome', 'Windows 8.1', '41'),
        'chrome_beta': add('chrome', 'Windows 8.1', 'beta')
    },
    'firefox': {
        'firefox_30': add('firefox', 'Windows 8', '30'),
        'firefox_37': add('firefox', 'Windows 8.1', '37')
    },
    'ienew': {
        'ie_11': add('internet explorer', 'Windows 8.1', '11'),
        'ie_10': add('internet explorer', 'Windows 8', '10')
    },
    'ie': {
        'ie_09': add('internet explorer', 'Windows 7', '9'),
        'ie_08': add('internet explorer', 'Windows 7', '8')
    }
};

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
        var target = browsers[key];
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
