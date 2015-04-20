function add(b, p, ver, device) {
    return {
        base: 'SauceLabs',
        browserName: b,
        platform: p,
        version: ver,
        deviceName: device
    };
}

function addAndroid(output) {
    output['android_4'] = add('android', 'Linux', '4.0', 'Android Emulator');
    output['android_4-4'] = add('android', 'Linux', '4.4', 'Google Nexus 7 HD Emulator');
}

function addIOS(output) {
    output['ios_safari_7-1'] = add('iphone', 'OS X 10.9', '7.1');
    output['ios_safari_8-2'] = add('iphone', 'OS X 10.10', '8.2');
}

function addChrome(output) {
    output['chrome_35'] = add('chrome', 'Windows 7', '35');
    output['chrome_41'] = add('chrome', 'Windows 8.1', '41');
    output['chrome_beta'] = add('chrome', 'Windows 8.1', 'beta');
}

function addFirefox(output) {
    output['firefox_30'] = add('firefox', null, null, '30');
    output['firefox_36'] = add('firefox', null, null, '36');
}

function addIE(output) {
    output['ie_11'] = add('internet explorer', 'Windows 8.1', '11');
    output['ie_10'] = add('internet explorer', 'Windows 8', '10');
    // output['ie_09'] = add('internet explorer', 'Windows 7', '9');
    // output['ie_08'] = add('internet explorer', 'Windows 7', '8');
}

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
        if (process.env.BROWSER_TYPE === 'android') {
            addAndroid(settings.customLaunchers);
        } else if (process.env.BROWSER_TYPE === 'ios') {
            addIOS(settings.customLaunchers);
        } else if (process.env.BROWSER_TYPE === 'chrome') {
            addChrome(settings.customLaunchers);
        } else if (process.env.BROWSER_TYPE === 'firefox') {
            addFirefox(settings.customLaunchers);
        } else if (process.env.BROWSER_TYPE === 'ie') {
            addIE(settings.customLaunchers);
        } else {
            console.error('Missing / Unknown pass ' + process.env.PASS);
            process.exit(1);
        }

        console.log('Running CI tests on', Object.keys(settings.customLaunchers).join(', '));
        settings.browsers = Object.keys(settings.customLaunchers);
    }

    config.set(settings);
};
