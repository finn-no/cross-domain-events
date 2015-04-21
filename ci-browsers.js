function add(b, p, ver, device) {
    return {
        base: 'SauceLabs',
        browserName: b,
        platform: p,
        version: ver,
        deviceName: device
    };
}

module.exports = {
    'android': {
        'android_4-1': add('android', 'Linux', '4.1', 'Android Emulator'),
        // 4.4 fails on first try via saucelabs, hard to track down...
        // 'android_4-4': add('android', 'Linux', '4.4', 'Android Emulator'),
        'android_5-1': add('android', 'Linux', '5.1', 'Android Emulator')
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
