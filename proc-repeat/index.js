"use strict";
const moment = require('moment');
const EventEmitter = require('events').EventEmitter;
const exec = require('child_process').exec;
const util = require('util');
const fs = require('fs');
const path = require('path');

function convertTimeUnitToMs(v, unit, cb) {
	return new Promise((resolve, reject) => {
		cb = typeof cb === 'function' ? cb : function(){};
		var ms = 0;

		switch(unit) {
			case "week":
			case "weeks":
			case "w":
				ms = +v * 1000 * 60 * 60 * 24 * 7;
				break;
			case "day":
			case "days":
			case "d":
				ms = +v * 1000 * 60 * 60 * 24;
				break;
			case "hour":
			case "hours":
			case "h":
				ms = +v * 1000 * 60 * 60;
				break;
			case "minute":
			case "minutes":
			case "m":
				ms = +v * 1000 * 60;
				break;
			case "second":
			case "seconds":
			case "s":
				ms = +v * 1000;
				break;
			case "msecond":
			case "mseconds":
			case "millisecond":
			case "milliseconds":
			case "ms":
				ms = +v;
				break;
			// assume that blank is don't have unit.
			case "":
				ms = 0;
				break;
			default:
				return reject(new Error('Invallid after unit: ' + unit));
		}

		resolve(ms);
	});
}

function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}

let uid = 0;
function genId() {
	return uid++;
}

function ProcRepeat(cmd) {
	EventEmitter.call(this);
	this._id = genId();
	this._cmd = cmd;
	this._startDate = null;
	this._endDate = null;
	this._every = {
		unit: "second",
		value: 1
	};
	this._times = -1;		// -1 means forever, 0 means no
	this._after = {
		unit: "",
		value: 0
	};
	this._name = "";
	this._writeFile = false;
	this._writePath = '';
	this._handler = null;
	this._runPath = '';
	this._executed = 0;
	this._success = 0;
	this._failed = 0;

	return this;
}
ProcRepeat.prototype.from = function(startDate) {
	this._startDate = moment(startDate);
	return this;
};
ProcRepeat.prototype.to = function(toDate) {
	this._endDate = moment(toDate);
	return this;
};
ProcRepeat.prototype.until = function(toDate) {
	this._endDate = toDate;
	return this;
};
ProcRepeat.prototype.every = function(v, unit) {
	this._every = {
		unit: unit,
		value: v
	};

	return this;
};
ProcRepeat.prototype.only = function(times) {
	this._times = times;
	return this;
};
ProcRepeat.prototype.times = function(t) {
	this._times = t;
	return this;
};
ProcRepeat.prototype.once = function() {
	this._times = 1;
	return this;
};
ProcRepeat.prototype.as = function(newName) {
	if(this._name) {
		console.log(`Overwrite schedule name ${this._name} to ${newName}.`);
	}

	this._name = newName;
	return this;
};
ProcRepeat.prototype.after = function(v, unit) {
	this._after = {
		unit: unit,
		value: v
	};

	return this;
};
ProcRepeat.prototype.config = function(config) {
	config = config || {};

	if(config.writeFile) {
		this._writeFile = true;
	}
	if(config.writePath) {
		this._writePath = config.writePath;
	}
	if(config.name) {
		if(this._name) {
			console.log(`Overwrite schedule name ${this._name} to ${config.name}.`);
		}

		this._name = config.name;
	}
	if(config.runPath) {
		this._runPath = config.runPath;
	}

	return this;
};
ProcRepeat.prototype.begin = function(cb) {
	if(this._endDate && moment() > this._endDate) {
		return this;
	}
	
	cb = typeof cb === 'function' ? cb : function(){};

	let afterVal = this._after.value;
	let afterUnit = typeof this._after.unit === 'string' ? this._after.unit.toLowerCase() : '';
	let everyVal = this._every.value;
	let everyUnit = typeof this._every.unit === 'string' ? this._every.unit.toLowerCase() : '';

	let iterationDuration = 0;
	let iterationCount = this._times;

	function execCommand(cmd) {
		var executed = this._executed;
		this._executed++;
		
		if(this._runPath) {
			cmd = `cd ${this._runPath};${cmd}`;
		}

		exec(cmd, (err, stdout, stderr) => {

			if(err) {
				this._failed++;

				this.emit('end', err);
				cb(err);
				return;
			}

			this._success++;

			this.emit('done', stdout, stderr);
			cb(null, stdout, stderr);

			// if write file option is sets true, write file to write path.
			if(this._writeFile) {
				let writePath = this._writePath ? this._writePath : __dirname;
				let filename = `${this._name}_${moment().unix()}_${this._id}_${executed}.log`; 
				
				let fullpath = path.resolve(writePath, filename);
				let text = JSON.stringify({
					stdout: stdout,
					stderr: stderr
				});

				let writeStream = fs.createWriteStream(fullpath);
				writeStream.on('error', (err) => {
					console.error(`Failed to write log to ${fullpath}.`, err);
				});

				writeStream.write(text);
				writeStream.end();
			}
		});
	}
	execCommand = execCommand.bind(this);

	// check after delay
	// also will additional time is not before start
	convertTimeUnitToMs(afterVal, afterUnit)
	.then((ms) => {
		let remains = 0;

		if(this._startDate) {
			let duration = moment.duration(this._startDate.diff(moment()));
			remains = duration.asMilliseconds();

			if(remains < 0) {
				remains = 0;
			}
		}

		return delay(ms + remains);
	})
	// check iteration
	.then(() => {
		return convertTimeUnitToMs(everyVal, everyUnit);
	})
	.then((ms) => {
		iterationDuration = ms;
	})
	// finally, do command!
	.then(() => {
		this._success = 0;
		this._failed = 0;
		this._executed = 0;

		if(this._writeFile && !this._name) {
			this._name = `unnamed${this._id}`;
			this._tempNameSet = true;
		}

		if(iterationCount !== 0) {
			execCommand(this._cmd);

			if(iterationCount < 0 || iterationCount > 1) {
				this._handler = setInterval(() => {
					execCommand(this._cmd);

					// finish execution when passed end data(~to)
					if(this._endDate && moment() > this._endDate) {
						clearInterval(this._handler);
					}
					else if(iterationCount > 0 && 
						this._executed >= iterationCount) {
						clearInterval(this._handler);
					}
				}, iterationDuration);
			}
		}

		return Promise.resolve();
	})
	.catch((err) => {
		this.emit('error', err);
		cb(err);
	});

	return this;
};
ProcRepeat.prototype.stop = function() {
	clearInterval(this._handler);

	this.emit('end', {
		executed: this._executed,
		success: this._success,
		failed: this._failed
	});

	// if file name was temporilay named, remove it.
	if(this._tempNameSet) {
		this._tempNameSet = false;
		this._name = '';
	}

	return this;
};

util.inherits(ProcRepeat, EventEmitter);

module.exports = function(cmd) {
	return new ProcRepeat(cmd);
};