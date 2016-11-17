# proc-repeat
proc-repeat is automated shell script executor by node.js.

## Install
> $ npm install --save proc-repeat


## Basic Example
Example of run command "$ node -v" every 500ms only 5 times and write the result into current path named schedule1.

```javascript
const repeat = require('./index.js');

repeat('node -v').every(500, 'ms').only(5)
.config({
	writeFile: true,
	writePath: __dirname,
	name: 'schedule1',
})
.begin();
```


## License
MIT. Free to use.


## Major changes
### 1.0.2
- Not much, just some bug fixes.


### 1.0.3
- Added more methods for easy and intuitive code.
- Now writing file format also supports text type.
- You can now seperate stdout and stderr with seperate config option.
- You can now select which output(stdout, stderr) want to "not included" when writing file.
- Some bug fixes.


### 1.0.4
- You don't have to specify writePath when writeFile is true. Default path is where you executed.
- You can define schedule as JSON and can load it from JavaScript. This also will use for CLI command to execute schedules. (Not current version)
- Every path like parameters are now based on where you executed.


### 1.0.5
- You can set append mode with appendMode option. Append Mode is only works with text mode, not json mode.
- Added unixTimeStamp option. If this false, using time string like 2016-11-17 16:34:30:99 when logging. Default is true.


## CPS and Event Handlers
proc-repeat is designed for supports two options to handling the process: CPS and Event Handlers.
begin() method which start the action accept the first parameter as function, callback, which call after shell command is done.

```javascript
repeat('pwd').begin((err, stdout, stderr) => {
	if(err) {
		return console.error(err);
	}

	console.log('stdout', stdout);
});
```

repeat() is a factory function that internally create new object and return. The Object returned from method implemented EventEmitter, so you can attach the event handlers. Possible events are:
- error: Fires when it has error
- done: Fires when single command execution is over.
- end: Fires when stopped everthing(I will explain this later).

```javascript
repeat('pwd')
.on('error', (err) => {
	console.error(err);
})
.on('done', (stdout, stderr) => {
	console.log('stdout', stdout)
})
.on('end', () => {
	console.log('All done!');
});
```


## Create schedule from external JSON
You can also define your schedule not just in JavaScript, with JSON. Each key is the name of a method of proc-repeat, like from, to, until, every and so on.
For create schedule as JSON, create [name].json first.

```json
{
	"cmd": "pwd",
	"every": [300, "ms"],
	"config": {
		"writeFile": true,
		"writePath": "./",
		"name": "schedule1"
	}
}
```

And then create JavaScript for execute this. For use JSON, you can use repeat.load():

```javascript
const repeat = require('proc-repeat');
repeat.load('./schedule1.json').begin();
```

You can also define multiple schedules as JSON and load them entirely at once.

```javascript
let schedules = repeat.load(['./schedule1.json', './schedule2.json']);
schedules[0].begin();
schedules[1].begin();
```

Not hard, isn't it? Only you should be careful is the setting path, when writing file or change run path before do command with runFrom(),
the source path that module finds something with your customized path is where you executed this JavaScript file.
That means that if you create JS file that load JSON and execute from current directory, all your directory settings are based on current location. 


## Create schedule with from and to
You can possible to create reserved or make time limit with from() method and to() method. Both method has single argument, date or string.
Internally it uses moment.js, so you can easily handle this if you are already know about it.

```javascript
// run "$ pwd" after 2016-10-14 18:00:00
repeat('pwd').from('2016-10-14 18:00:00')
.begin();
```

```javascript
// run until 2016-10-14 19:00:00
repeat('pwd').to('2016-10-14 19:00:00')
.begin();
```

Or you can use until method, alias of to method.

```javascript
repeat('pwd').until('2016-10-14 19:00:00')
.begin();
```

You can combine them.

```javascript
repeat('pwd').from('2016-10-14 18:00:00').to('2016-10-14 19:00:00')
.begin();
```


## Log to file
Most of the time, you want to write the result to a file. You can use config option:
 
```javascript
repeat('pwd')
.config({
	writeFile: true,
	writePath: __dirname
})
.begin();
```

You can set the name of a file with name option or use as() method.

```javascript
repeat('pwd')
.config({
	writeFile: true,
	writePath: __dirname
	name: 'myschedule1'
});
```

or

```javascript
repeat('pwd').config({ writeFile: true, writePath: __dirname }).as('myschedule1').begin();
```

Both are totally same. ~~For write file, you must set writePath too, otherwise it fails.~~
** Since 1.0.4, you don't have to specify writePath. By default, it writes where you executed. Only use this property when you want to set to different location.


## APIs

### constructor(sting cmd)
Create new schedule. Basic settings(default) are run the command every 1 second until you manually stop it(with stop method).

```javascript
const repeat = require('proc-repeat');
repeat('ls -al').begin();
```


### repeat.load(string path)
### repeat.load(array path)
Load JSON based schedule(s). It works synchronously. If you pass single string, it will return new proc-repeat type object.
But if you pass array of strings, it will return the array that has each proc-repeat object.
Becareful when loading multiple JSONs and execute them.


### from(string date)
### from(Date date)
Set the time when it starts.

```javascript
repeat('ls -al').from('2016-10-14 18:00:00').begin();
```


### to(string date)
### to(Date date)
### until(string date)
### until(Date date)
Set the time limit.

```javascript
repeat('ls -al').until('2016-10-14 18:00:00').begin();
```


### every(int value, string timeUnit)
Set the duration. timeUnit is string that must one of these values:
- week
- weeks
- w
- days
- day
- d
- hour
- hours
- h
- minute
- minutes
- m
- seconds
- second
- s
- msecond
- mseconds
- millisecond
- milliseconds
- ms 

```javascript
repeat('ls -al').every(10, 'seconds').begin();
```


### only(int times)
### times(int times)
Set the iteration count.

```javascript
repeat('ls -al').only(2).begin();
```


### once(void)
Execute schedule only once. Same as times(1).

```javascript
repeat('ls -al').once().begin();
```


### as(string name)
Name the schedule.

```javascript
repeat('ls -al').config({ writeFile: true, writePath: __dirname }).as('schedule1').begin();
```


### after(int value, string timeUnit)
Delay the start of the execution. With "from", also delays when it starts execution.

```javascript
repeat('ls -al').after(5, 'seconds').begin();
``` 

```javascript
repeat('ls -al').from('2016-10-14 18:00:00').after(1, 'minute').begin();
```


### (1.0.3) saveAsFileTo(string path)
Write output as a file.

```javascript
repeat('ls -al').saveAsFileTo(__dirname);
```


### (1.0.3) asFormat(string writeFormat)
Set format to write as a file. Valid values are 'json' and 'text'. Default is 'json'.

```javascript
repeat('ls -al').saveAsFileTo(__dirname).asFormat('text')
```


### (1.0.3) asJSON(void)
Set write format to json. Most of time, you don't have to call this because JSON is default option.


### (1.0.3) asText(void)
Set write format to text.


### (1.0.3) runFrom(string path)
Set run path.

```javascript
repeat('pwd').runFrom('/home/ec2-user').saveAsFile(__dirname);
```


### config(object configs)
Set the options.
- bool writeFile: Write file. Default is false. You can now change format from 1.0.3
- bool writePath: Set the path where to write a file. Default is current directory.
- bool writeFormat: (New 1.0.3) Set the format which want to print. Default is 'json'. Valid values are 'text' and 'json'(until yet).
- bool seperate: (New 1.0.3) Divide stdout and stderr into seperate files. Default is false.
- bool stdout: (New 1.0.3) Set true to write stdout into a file. Default is true.
- bool stderr: (New 1.0.3) Set true to write stderr into a file. Default is true.
- string name: Set the name of this schedule. Same as using as() method.
- string runPath: Path for executing the command. Default is current directory.


### begin(function callback)
Start the schedule.

```javascript
repeat('ls -al').begin();
```


### stop()
Finish the schedule. It will fires "end" event also.

```javascript
let schedule = repeat('ls -al').begin();

setTimeout(() => {
	schedule.stop();
}, 3000);
```


## More examples
proc-repeat provides lots of methods that easily combime them. Only you need is a little bit of creativity.

### Do something every second but only 10 times, but stop when reaches specific times.

```javascript
repeat('pwd').every(1, 'second').only(10).until('2016-10-16 18:00:00')
.begin();
```

### Do something between specific times every 300 milliseconds.

```javascript
repeat('node -v').every(300, 'ms').from('2016-10-16 18:00:00').to('2016-10-16 18:01:00');
```


### Write as append mode.
You can set append mode from v1.0.5, for writing multiple logs at single file. Only each first execution will make a file.

```javascript
let schedule = repeat('pwd').times(20).every(300, 'ms')
.config({
	runPath: __dirname,
	writeFile: true,
	unixTimeStamp: false,
	appendMode: true,
	writeFormat: 'text',		// make sure to set writeFormat as 'text', 'json' will throw exception.
	seperate: true
});
```


## Currently working on features(Not supported on current version)
- CLI execution with specific setting files like:

```json
schedules.json
{
	"schedule1": {
		"cmd": "ls -al",
		"from": "2014-10-24 11:24:30",
		"to": "2014-10-25 11:24:30",
		"every": [5, "minutes"],
		"config": {	
			"writeFile": true,
			"name": "result",
			"writePath": "/home/ec2-user/app",
			"stderr": false
		}
	}
}
```

> $ proc-repeat schedules.json


## P.S.
1.0.4 version can be little buggy, so please notice me on github page if you faced some problems. Thanks!