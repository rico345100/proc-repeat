"use strict";
const repeat = require('./index.js');

let schedule = repeat('pwd').until('2016-10-14 16:21:00').every(300, 'ms').times(5)
.config({
	writeFile: true,
	writePath: `${__dirname}/logs`,
	name: 'schedule1',
})
.begin();