# proc-repeat
proc-repeat is automated shell script executor by node.js.

## Install
> $ npm install --save proc-repeat


## Basic Example
Example of run command "$ pwd" every 500ms only 5 times and write the result into current path named schedule1.

```javascript
const repeat = require('./index.js');

repeat('pwd').every(500, 'ms').only(5)
.config({
	writeFile: true,
	writePath: `${__dirname}`,
	name: 'schedule1',
})
.begin();
```


## License
MIT. Free to use.


## CPS and Event Handlers
proc-repeat is designed for support two options to handling the processes: CPS and Event Handlers.
*.begin() method accept the first parameter, the callback, which call after shell command is done.

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


## Create schedule with from and to
You can possible to create reserved or make timelimit with from method and to method. Both method has single argument, date or string.
Internally it uses moment.js so you can easily handle this if you are already know about that.

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
Mostly, you want to write the result to a file. You can use config option make it possible.
 
```javascript
repeat('pwd')
.config({
	writeFile: true
})
.begin();
```

You can set the name of a file with name option or use as method.

```javascript
repeat('pwd')
.config({
	writeFile: true,
	name: 'myschedule1'
});
```

or

```javascript
repeat('pwd').config({ writeFile: true }).as('myschedule1').begin();
```

Both are totally same.


## APIs

### constructor(sting cmd)
Create new schedule. Basic settings(default) are run the command every 1 second until you manually stop it(with stop method).

```javascript
const repeat = require('proc-repeat');
repeat('ls -al').begin();
```


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
Sets the duration. timeUnit is string that must one of these value:
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
Sets the iteration count.

```javascript
repeat('ls -al').only(2).begin();
```


### once(void)
Execute only once. Same as times(1).

```javascript
repeat('ls -al').once().begin();
```


### as(string name)
Name the schedule.

```javascript
repeat('ls -al').config({ writeFile: true }).as('schedule1').begin();
```


### after(int value, string timeUnit)
Delay the start of the execution. With "from", also delays when it starts execution.

```javascript
repeat('ls -al').after(5, 'seconds').begin();
``` 

```javascript
repeat('ls -al').from('2016-10-14 18:00:00').after(1, 'minute').begin();
```


### config(object configs)
Sets the options.
- bool writeFile: Write file. Format is JSON. Default is false.
- bool writePath: Set the path where to write file. Default is current directory.
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


## Currently working on features(Not supported on current version)
- CLI execution with specific setting files like:

```json
schedules.json
{
	"schedule1": {
		"cmd": "ls -al",
		"startFrom": "2014-10-24 11:24:30",
		"to": "2014-10-25 11:24:30",
		"every": [5, "minutes"],
		"config": {	
			"writeFile": true,
			"name": "result",
			"path": "/home/ec2-user/app"
		}
	}
}
```

> $ proc-repeat schedules.json