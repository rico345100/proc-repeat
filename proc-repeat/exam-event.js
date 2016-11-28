"use strict";
const repeat = require('./index.js');

// Event Handlers
let schedule = repeat('pwd').times(20).every(300, 'ms')
.config({
	runPath: __dirname,
	writeFile: true,
	unixTimeStamp: false,
	appendMode: true,
	writeFormat: 'text',
	writeDaily: true,
	seperate: true,
	stderr: false
});

schedule.on('error', (err) => {
	console.log('error!');
	console.log(err);	
});
schedule.on('done', (stdout, stderr) => {
	console.log('stdout:', stdout);
	console.log('stderr:', stderr);
});
schedule.on('end', (info) => {
	console.log(info);
});

schedule.begin();