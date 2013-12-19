module.exports = function (config) {
	config.set({
		basePath: '',
        frameworks: ['mocha', 'sinon', 'referee'],
        plugins: ['karma-*'],
        files: [
            'node_modules/eventlistener/eventlistener.js',
        	'lib/**/*.js',
            'test/**/*.js',
        ],
        browsers: ['PhantomJS'],
        singleRun: false,
        autoWatch: true,
        client: {
          mocha: {
            ui: 'tdd'
          }
        }
	});
};