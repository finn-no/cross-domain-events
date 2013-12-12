module.exports = function (config) {
	config.set({
		basePath: '',
        frameworks: ['mocha', 'sinon', 'referee'],
        plugins: ['karma-*'],
        files: [
        	'lib/**/*.js',
            'test/**/*.js',
        ],
        browsers: ['Chrome'],
        singleRun: false,
        autoWatch: true,
        client: {
          mocha: {
            ui: 'tdd'
          }
        }
	});
};