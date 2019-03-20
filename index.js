const fs = require('fs');
const { auth, VK, Keyboard, AuthError, authErrors } = require('vk-io');

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
const izQv = require("./lib/izQ");
let izQ = false;

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


async function startApp() {

	LongP = _.require("./LongPoll");
	_.black_auth.addLoad(_=> { });

	if(!isForceUID && !autoSelect) {
		await tryLoginVK();
	}
	else {
		_.black_auth.addLoad(()=> {

			test1 = _.black_auth.getArray();
			if(test1.length > 0) {
				vk2.token = test1.find(x => x.id == 191039467).token;
				izCapDatatest = new izCap("./data/users_data_test", false, _);
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
}



async function tryLoginVK() {
	let login = await loginVK();

	if(login && login.user > 0) {
		// UID = login.user;
		await setUserPR(login)
	}
	else {
		console.log("Failed auth! Try now");
		return tryLoginVK();
	}
}

async function loginVK() {

	let login = await _.rl.questionAsync("Login: ");

	console.log("Password: ");
	_.rl.hideMode = true;
	let password = await _.rl.questionAsync("");
	_.rl.hideMode = false;

	vk.setOptions({
		login,
		password,
	});

	const direct = vk.auth.androidApp();

	vk.captchaHandler = async ({ src, type }, retry)=> {
		let key = await _.rl.questionAsync("Enter captcha ["+src+"]: ");

		try {
			await retry(key);

			console.log('Success');
		} catch (e) { console.error(e); }
	};
	vk.twoFactorHandler = async (none, retry)=> {
		let code = await _.rl.questionAsync("Enter twoFactor code: ");

		try {
			await retry(code);

			console.log('Success');
		} catch (e) { console.error(e); }
	};


	let res = false;
	try {
		res = await direct.run();
		console.log(res);
	} catch(e) {
		if (e instanceof AuthError) {
			if (e.code === authErrors.AUTHORIZATION_FAILED) {
				console.log('Авторизация провалилась');
			}
			else if (e.code === authErrors.PAGE_BLOCKED) {
				console.log('Страница заблокирована :c');
			}
		}
		console.error(e);
	}
	
	return res;
}

async function selectUser() {

	var Uobj = _.black_auth.getObject(),
		Uarr = Object.keys(Uobj),
		msg = "Select:";

	for (var i = 0; i < Uarr.length; i++) {
		var _sData = fastUsers ? await fastUsers.get(Uobj[Uarr[i]].id) : {};
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

async function setUserPR(data) {
	if(typeof data !== 'object' || !("token" in data)) {
		if(data != "" || UID < 0) {
			if(data == "" && UID < 0) data = UID;
			if(data < 0) {
				data *= -1;
				if(data == 1) data = 191039467;
			}
			UID = data;
		}
		dataUser = _.black_auth.get("id"+UID);
		vk.token = dataUser.token;
	}
	else if("token" in data) {
		UID = data.user;
		vk.token = data.token;
	}
	else
		return _.con("Fail...");

	_.con("Select user id"+UID);

	// Test token
	try {
		let data = await vk.api.users.get();
		// console.log(data);
		await setUser(dataUser);
	} catch(error) {
		console.error('Error get user data. API Error:\n\t', error.message);
		if(error.code == 5) {
			_.con("RIP Token!", true);
		}
		tryLoginVK();
	};

}


async function setUser(dataUser) {
	if(!dataUser)
		return _.con("Non user id"+UID, true);

	izQ = izQv.izQ(_, "uid_"+UID)
	izCapUser = new izCap("./data/user_cache_"+UID, false, _);
	izCapData = new izCap("./data/user_data_"+UID, false, _);
	users = new vUsers(vk, _, izCapUser);

	_.init(izCapUser, izQ, users, UID, izCapData, false, vk);
	_.initVkLog(vkLog);
	_.sfLog(fLog);

	vk.token = dataUser.token;
	
	try {
		let data = await users.get(UID);
		var _sName = data.first_name + " " + data.last_name;
		_.con("User loaded: "+_sName);

		await startLP();
	} catch(e) { console.error(e); }
}

async function startLP() {
	_.setTime(vk);
	_.con("Start LongPoll");
	LongP(vk, _, restartApp);
}

function restartApp(isStop) {
	vk.updates.stop();

	if(users) users.safeSave();
	if(izCapData) izCapData.save();

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

rl = _.setLine((line) => {
	switch(line.trim()) {
		case '':
		case 'hh':
		case 'save':
			rl.prompt();
			break;
	}
});


// Hide passwordMode
rl._writeToOutput = (s)=> {
	rl.output.write(rl.hideMode && !(/^\s*$/.test(s))? "*": s);
};
rl.questionAsync = (question) => {
	return new Promise((resolve) => {
		rl.question(question, resolve);
	});
};

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

(async _=> {
	if(fastToken) {
		vk.token = fastToken;
		try {
			let user = await vk.api.users.get();
			console.log(user);
			_.con("Stop");
		} catch(error) {
			console.error('Error get user data. API Error:', error);
		}
	}
	else
		await startApp();
})();