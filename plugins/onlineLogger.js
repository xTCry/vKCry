var vk;

let lastOnline = {},
	appsName = {},
	consoleLog = true;

const authPlatform = {
	'mobile': 1,
	'iphone': 2,
	'ipad': 3,
	'android': 4,
	'wphone': 5,
	'windows': 6,
	'web': 7,
	'standalone': 8,
};

function tryLoad() {
	if(_.izCapData.loaded) {
		lastOnline = _.izCapData.get("pl:onlineLogger:lastOnline", lastOnline);
		appsName = _.izCapData.get("pl:onlineLogger:appsName", appsName);
		consoleLog = _.izCapData.get("pl:onlineLogger:consoleLog", consoleLog);
		
		_.con("User DATA Loaded [onlineLogger]", "cyan");
	}
	else
		_.izCapData.addLoad(tryLoad)
}

var rl = _.setLine((line) => {
	switch(line.trim()) {
		case 'hh':
			_.ccon("-- onlineLogger --", "red");
			_.ccon("onlinelog	- set state console log online");
			break;
		case 'onlinelog':
		case 'logonline':
			_.rl.question("Console log online users status. (Current state: O"+(consoleLog? "N": "FF")+") (y/n/other toggle) [toggle]: ", (data) => {
				consoleLog = (data == "y" || data == "Y")? true:
							(data == "n" || data == "N")? false:
							(data == "toggle" || data=="")? !consoleLog: consoleLog;

				_.con("consoleLog state: O"+(consoleLog? "N": "FF"));
				_.izCapData.set("pl:onlineLogger:consoleLog", consoleLog).save(false, false);
			});
			break;
	}
});

module.exports = (_vk, _h) => {
	vk = _vk;
	let lp = _vk.updates;
	
	tryLoad();

	/*
	
		Сравнимать последнее времся онлайна и оффлайна
		Вычислить тех, кто юзает "недоневидимку"
		
		... ззх зачем это
	
	*/ 

	lp.on('user_online', async (context, next) => {
		const { userId, platformName } = context;
		let uLO = lastOnline[userId];

		if(lastOnline[userId] == undefined) {
			uLO = lastOnline[userId] = {
				timeOn: _.getTime(),
				timeOff: 0,
				status: 1,	// Online
				isSpy: false,
				count: 0,
				app: 0,
				timeTGApp: 0
			};
		}
		// Если app не получни последняя проверка уже кулдаун, then...
		else if(uLO.app == 0 && (_.getTime() - uLO.timeTGApp > 60)) {
			if(platformName != "standalone") {
				try {
					let user = await _.users.getFast(userId)[0];

					if(user.online_app != undefined) {
						var appName = appsName[user.online_app] || "";
						// _.con("Getted user Application Online: ["+appName+"] - "+user.online_app, "yellow")
						uLO.app = user.online_app;
					}
				} catch(e) { }
			}
		}

		if(uLO.app > 0 && appsName[uLO.app] == undefined)
			getAppName(uLO.app);

		uLO.timeOn = _.getTime();

		var lastStatus = uLO.status;
		uLO.status = authPlatform[platformName];
		_.izCapData.set("pl:onlineLogger:lastOnline", lastOnline);
		
		try {
			let user = await _.users.get(userId);
			var status = user.status,
				fullName = user.first_name+" "+user.last_name;
			var cApp = uLO.app,
				subApp = (cApp>0?(" <app ("+cApp+") "+((appsName[cApp] != undefined)?"["+appsName[cApp]+"]> ":"> ")):"");

			_.izQ.RecOnline(userId, authPlatform[platformName], false, fullName, subApp+status )


			if( !uLO.isSpy && (lastStatus != -2 || _.getTime() - uLO.timeOff > 10))
				consoleLog && _.con(fullName+" ["+userId+"] user Online "+platformName+" "+subApp, "green");
			else
				consoleLog && _.con(fullName+" ["+userId+"] user Online (SPY) "+platformName+subApp, "grey");
		} catch(e) { }

		await next();
	})
	.on('user_offline', async (context, next) => {
		const { userId, isSelfExit } = context;
		let uLO = lastOnline[userId];

		if(lastOnline[userId] == undefined) {
			uLO = lastOnline[userId] = {
				timeOn: 0,
				timeOff: _.getTime(),
				status: isSelfExit?-2:-1,	// Exit | AFK
				isSpy: false,
				count: 0,
				app: 0
			};
		}
		// Если был онлайн и меньше или = 9 second, then...
		else if(isNowSpy(userId)) {
			
			if(uLO.count < 3) {
				uLO.count++;
			}
			else if(!uLO.isSpy) {
				uLO.isSpy = true;
				consoleLog && _.con("Set SPY diagnose", "yellow")
			}
		}
		else if(_.getTime() - uLO.timeOn > 360) {
			// Сброс инфы, так, на всяк случай
			if(uLO.isSpy) {
				uLO.isSpy = false;
				consoleLog && _.con("UNSet SPY diagnose...", "yellow")
			}
			uLO.count = 0;
			uLO.app = 0;
		}

		uLO.timeOff = _.getTime();
		uLO.status = isSelfExit?-2:-1;

		if(!isSelfExit && uLO.isSpy)
			uLO.isSpy = false;

		_.izCapData.set("pl:onlineLogger:lastOnline", lastOnline);
		try {
			let user = await _.users.get(userId);
			var status = user.status,
				fullName = user.first_name+" "+user.last_name;
			var zz = isSelfExit?-2:-1;

			_.izQ.RecOnline(userId, zz, false, fullName, status);

			if(!isSelfExit || (uLO.timeOn - uLO.timeOff > 9) || _.getTime() - uLO.timeOn > 15)
				consoleLog && _.con(fullName+" ["+userId+"] user Offnline "+(isSelfExit?"EXIT":"AFK"), "red");
		} catch(e) { }

		await next();
	})
};

async function getAppName(appId) {
	try {
		let data = vk.api.call('apps.get', {
			app_id: appId
		});
		data = (data.count > 0) ? data.items[0] : false;
		
		if(!data)
			return consoleLog && _.con("Error get app info", true), false;

		if(data.title != undefined) {
			if(consoleLog)
				_.con("App("+appId+") title ["+data.title+"]", "yellow");
			
			{
				appsName[appId] = data.title;
				_.izCapData.set("pl:onlineLogger:appsName", appsName);
			}

			return data.title;
			
		}
	} catch(error) {  console.error(error); }
}

function isNowSpy(user) {
	var pastTense = _.getTime() - lastOnline[user].timeOn;
	return (lastOnline[user].status > 0 && pastTense <= 9);
}
