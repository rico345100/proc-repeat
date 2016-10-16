"use strict";
const repeat = require('./index.js');

let schedule = repeat('pwd').until('2016-10-14 16:21:00').every(300, 'ms').times(5)
.saveAsFileTo(__dirname).runFrom('/Users/rico345100').asText()
.config({
	name: 'schedule1',
	stderr: false
})
.begin((err, stdout, stderr) => {
	console.log(stdout);
});