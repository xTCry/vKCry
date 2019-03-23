const colors = require('colors/safe'),
	ReadLine = require('readline');

let config;
try {
	config = require('../.config');
} catch (e) {
	config = { };
}

let vfLog = false,
	vkLog = false;

let startTime = nowUNIX();

let xtime = 0,
	utime = 0;

let black_auth = new (require((config.black_auth)? config.black_auth: "./black_auth"))();


Array.prototype.remove = function() {
	var what, a = arguments, L = a.length, ax;
	while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			this.splice(ax, 1);
		}
	}
	return this;
};

colors.setTheme({
	dateBG: 'bgMagenta',
	dataC: 'yellow',
	warnBG: 'bgBlack',
	warn: 'yellow',
	errorBG: 'bgBlack',
	error: 'red'
});

function ccon(message, color, colorBG) {
	if(message === undefined) {
		console.log("\n")
		return;
	}

	if(color === true) {
		color = "red";
		colorBG = "Blue";
	}

	colorBG = "bg"+ ((typeof colorBG == "string")?colorBG:"Black");
	color = (typeof color == "string")?color:"green";

	console.log(colors[colorBG](colors[color](message)) );
}
function con(message, color, colorBG) {
	if(message === undefined) {
		console.log("\n")
		return;
	}

	if(color === true) {
		color = "red";
		colorBG = "Blue";
	}
	
	/*bgBlack
	bgRed
	bgGreen
	bgYellow
	bgBlue
	bgMagenta
	bgCyan
	bgWhite*/

	colorBG = "bg"+ ((typeof colorBG == "string")?colorBG:"Black");
	color = (typeof color == "string")?color:"green";

	console.log(colors.dateBG( '[' +dateF()+ ']' )+": "+ colors[colorBG](colors[color](message)) );
}

function dateF(date) {
	if(!isNaN(date) && date < 9900000000)
		date *= 1000; // UNIXto
	date = date!==undefined ? new Date(date) : new Date(UNIXto(getTime()))
	
	var dYear = date.getFullYear()
		, dMonthF = (date.getMonth()+1)
		, dMonth = dMonthF > 9 ? dMonthF : "0"+dMonthF
		, dDay = date.getDate() > 9 ? date.getDate() : "0"+date.getDate()
		, dHour = date.getHours() > 9 ? date.getHours() : "0"+date.getHours()
		, dMinutes = date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes()
		, dSeconds = date.getSeconds() > 9 ? date.getSeconds() : "0"+date.getSeconds()
		, date_format = dDay +'.' +dMonth +'.' +dYear +' '+ dHour + ':' + dMinutes + ':' + dSeconds;
	
	return date_format;
}
con("Started");

function genName() {
	return this.UID+"_"+Math.floor(this.nowUNIX() / 100000)
}

function initVkLog(_Log) {
	vkLog = new _Log(this.UID);
}
async function inVkLog(dialogID, dialogName, data) {
	return await vkLog.insertMessage(dialogID, dialogName, data);
}
function createReplyMessage(data) {
	return vkLog.replyMessage(data);
}
function createSpoiler(data) {
	return vkLog.createSpoiler(data);
}

function sfLog(_fLog) {
	vfLog = new _fLog(this, this.genName(), "log/"+this.UID);
}
function fLog(data, color, colorBG) {
	color = color || "black";
	colorBG = colorBG || "black";
	vfLog.log(data, color, colorBG)
}

function init(_izCap, _izQ, _users, _UID, _izCapData, _rl, _vk) {
	this.izCap = _izCap
	this.izQ = _izQ
	this.users = _users
	this.UID = _UID
	this.izCapData = _izCapData
	if(_rl)
		this.rl = _rl
	this.vk = _vk
}

function rnd(min, max) {
	if(max===undefined) {
		max=min
		min=0
	}
	return Math.floor(min + Math.random() * (max + 1 - min));
}

function nowUNIX() {
	return Math.floor(Date.now() / 1000);
}
function UNIXto(date) {
	return date*1000;
}
function getTime() {
	return nowUNIX() - (xtime - utime);
}
function setTime(vk) {
	vk.api.call("utils.getServerTime")
	.then((response) => {
		xtime = nowUNIX();
		utime = response;
		con('VK time: :'+ response);
	})
	.catch((error) => {
		console.error(error);
	});
}

function setLine(cb) {
	if(!this.rl) {
		this.rl = ReadLine.createInterface(process.stdin, process.stdout);
		this.rl.setPrompt('_> ');
		this.rl.prompt();
	}
	this.rl.on('line', cb);
	return this.rl;
}


// Console Beautifyrrr ;;

var isDefined = x => x !== null && x !== undefined;

const logUpdate = require('log-update');
const chalk = require('chalk');
const elegantSpinner = require('elegant-spinner');
const logSymbols = require('log-symbols');
const figures = require('figures');

const pointer = chalk.yellow(figures.pointer);
const skipped = chalk.yellow(figures.arrowDown);

var spinner = false;

function getSymbol(type) {
	if (!spinner) {
		spinner = elegantSpinner();
	}

	if (type == "pending") {
		return chalk.yellow(spinner());
	}
	if (type == "pointer") {
		return pointer;
	}

	if (type == "success") {
		return logSymbols.success;
	}

	if (type == "error") {
		return logSymbols.error;
	}

	if (type == "skipped") {
		return skipped;
	}

	return ' ';
};

async function getName(id) {
	let sData = await this.users.get(id);
	return (sData && sData.first_name)?(sData.first_name + " " + sData.last_name):
			(sData && sData.name)? sData.name:
			("ZZH-"+id);
}

function requireUncached(module) {
	delete require.cache[require.resolve(module)]
	return require(module)
}

function htmlEntities(str) {
    return String(str)
    	.replace(/&/g, '&amp;')
    	.replace(/</g, '&lt;')
    	.replace(/>/g, '&gt;')
    	.replace(/"/g, '&quot;')
    	.replace(/(?:\r\n|\r|\n)/g, '<br>');
}

global._ = module.exports = {
	ccon,
	con,
	rnd,

	init,
	dateF,
	sfLog,
	fLog,

	startTime,

	setTime,
	getTime,
	UNIXto,
	nowUNIX,
	now: nowUNIX,

	black_auth,

	require: requireUncached,

	genName,

	setLine,

	isDefined,
	getSymbol,

	logUpdate,
	chalk,
	elegantSpinner,
	logSymbols,
	figures,

	getName,

	initVkLog,
	inVkLog,
	createSpoiler,
	createReplyMessage,

	genUX: _=> Math.floor(Date.now() / 1e8),

	htmlEntities,

};