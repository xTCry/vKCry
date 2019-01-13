const fs = require('fs');
const { VK, Keyboard } = require('vk-io');

process.on('uncaughtException', (err) => {
	console.log("\n*===*\nERR:");
	console.error(err);
	console.log("*===*\n");
});

const _ = require("./lib/helper");
const vkLog = require("./lib/vkLog");
const fLog = require("./lib/fLog");

const izCap = require("./lib/izCap");
let izCapUser = false;
// const izQv = require("./lib/izQ");
// let izQ = false;

const vUsers = require("./lib/usersData");
let users = false;

let vk = new VK()
	, vk2 = new VK()
	, LongP = false;


var usersLoaded = false;
var autoSelect = true;
var UID = false;
var isForceUID = false;
var fastToken = false;



var test1 = izCapDatatest = fastUsers = false;

var dataUser = false;
	usersLoaded = true;

function startApp() {

	LongP = _.require("./LongPoll");

	_.black_auth.addLoad(()=> {

		test1 = _.black_auth.getArray();
		if(test1.length > 0) {
			vk2.token = test1[0].token;
			izCapDatatest = new izCap("./data/users_data", false, _);
			fastUsers = new vUsers(vk2, _, izCapDatatest);
		}
		else {
			_.con("NULL Tokens", true);
			return;
		}

		if(autoSelect) {
			setTimeout(selectUser, 1e3);
		}
		else {
			if(isForceUID)
				setUserPR(UID)
			else
				_.rl.question("Enter userID (-1, -2, -3, -4, -5, -6, -7) or default ("+UID+"): ", setUserPR);
		}
	})
	.load();
}

function selectUser() {

	var Uobj = _.black_auth.getObject(),
		Uarr = Object.keys(Uobj),
		msg = "Select:";

	for (var i = 0; i < Uarr.length; i++) {
		var _sData = fastUsers ? fastUsers.get(Uobj[Uarr[i]].id) : {};
		_sData = " "+(_sData && _sData.first_name?(_sData.first_name + " " + _sData.last_name) : "");

		// msg += (i%3==0?"\n":"\t")+(i+1)+". "+Uobj[Uarr[i]].id
		msg += (i%2==0?"\n":"\t")+(i+1)+". id"+Uobj[Uarr[i]].id + _sData + (i%2==0?"\t| ":"")
	}
	msg += "\nEnter ID: ";

	_.rl.question(msg, data=> {
		if(data >= 1 && data <= Uarr.length)
			setUserPR(Uobj[Uarr[data-1]].id);
		else
			selectUser();
	});
}

function setUserPR(data) {
	if(data != "" || UID < 0) {
		if(data == "" && UID < 0) data = UID
		if(data < 0) {
			data *= -1;
			if(data == 1) data = 191039467;
		}
		UID = data;
	}
	dataUser = _.black_auth.get("id"+UID)
	_.con("Select user id"+UID);

	// Test token
	vk.token = dataUser.token;

	vk.api.users.get()
	.then((data) => {
		console.log(data);
		setUser(dataUser);
	})
	.catch((error) => {
		console.error('Error get user data. API Error:\n\t', error.message);
		if(error.code == 5) {
			_.con("RIP Token!", true);
		}
	});

}


function setUser(dataUser) {
	if(!dataUser)
		return _.con("Non user id"+UID, true);

	izQ = false;//izQv.izQ(_, "uid_"+UID)
	izCapUser = new izCap("./data/user_cache_"+UID, false, _);
	izCapData = new izCap("./data/user_data_"+UID, false, _);
	users = new vUsers(vk, _, izCapUser);

	var rl = false;
	_.init(izCapUser, izQ, users, UID, izCapData, rl, vk);
	_.initVkLog(vkLog);
	_.sfLog(fLog);

	vk.token = dataUser.token;
	
	var _sData = users.get(UID, (data)=> {
		var _sName = data.first_name + " " + data.last_name;
		_.con("User loaded: "+_sName);
	});

	setTimeout(startLP, 1000);
}

function startLP() {
	_.setTime(vk);
	_.con("Start LongPoll");
	LongP(vk, _, restartApp);
}

function restartApp(isStop) {
	vk.updates.stop();

	if(izCapUser) izCapUser.save();
	if(izCapData) izCapData.save();
	if(users) users.safeSave();

	izCap.reizCS();

	izQ = izCapUser = izCapData = false;

	if(isStop)
		return;

	vk = new VK();

	startApp();
}


setInterval(()=>{
	_.sfLog(fLog);
	_.con("auto refLog", "yellow");

	// Auto save
	if(izCapUser) izCapUser.save()
	if(izCapData) izCapData.save()
}, 60*60*1e3);

var rl = _.setLine((line) => {
	switch(line.trim()) {
		
		case '':
			break;

		case 'hh':
			_.ccon("Cmds:", "red");
			_.ccon("Save - save data");
			_.ccon("Reload - reload/restart app");
		break;		
			
		case 'save':
			if(izCapUser) izCapUser.save()
			if(izCapData) izCapData.save()
			break;

		case 'reload':
		case 'restart':
			restartApp();
			break;
	}
});

// var azone = require("./modules/azone");
// var dialDumper = require("./modules/dialDumper");
// var dialDumperBea = require("./modules/dialDumperBea");

var rl2 = _.setLine((line) => {
	switch(line.trim()) {
		case '':
		case 'hh':
		case 'save':
			rl2.prompt();
			break;
	}
});

//

process.stdin.resume();
process.on('SIGINT', tryExit);
function tryExit() {
	_.con('The process will be stopped...', "red");
			
	if(izCap.izCS().length > 0) {
		izCap.izCS().forEach((data, index)=> {
			if(!data.isExitSave)
				data.save(true, true, checkTryExit)
		})
	}
	checkTryExit()
}
function checkTryExit() {
	
	var allSaved = true
	
	izCap.izCS().forEach((data)=> {
		if(allSaved && !data.isExitSave)
			allSaved = false
	})
	
	if(allSaved) {
		process.exit()
		_.con('Process stopped', "yellow");
	}
}


// Start user interface

for (var argn = 2; argn < process.argv.length; argn++) {

	if (process.argv[argn].startsWith("--")) {
		var dTest = process.argv[argn].split("--");
		if(dTest.length == 2 && (dTest = parseInt(dTest[1])) && !(autoSelect=isNaN(dTest))) {
			UID = dTest*(-1);
			continue;
		}
	}

	if(["-f", "-i", "-t"].includes(process.argv[argn])) {

		// Token
		if (process.argv[argn] == '-t') {
			var dTest = process.argv[argn + 1];
			if(typeof dTest == "string" && dTest.length > 10 && dTest.length < 30) {
				fastToken = dTest;
				argn++;
				continue;
			}
		}

		// Set fast ID
		if (process.argv[argn] == '-i') {
			var safeI = parseInt(process.argv[argn + 1]);

			autoSelect = isNaN(safeI);
			UID = autoSelect? false : safeI;

			argn++;
			continue;
		}

		// Fast mode
		if (process.argv[argn] == '-f') {
			isForceUID = true;
			continue;
		}
	}
}

if(fastToken) {
	vk.token = fastToken;

	vk.api.users.get()
	.then((data) => {
		console.log(data);
	})
	.catch((error) => {
		console.error('Error get user data. API Error:', error);
	});
}
else
	startApp();

