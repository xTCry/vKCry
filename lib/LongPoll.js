let vk;

let LongPoll = function(_vk, _h, _cb) {
	vk = _vk;
	// _ = _h;

	Start(_cb);
	require("./LongPollEvents")(vk);
}

function Start(_cb) {
	vk.setOptions({ pollingAttempts: 50 });
	vk.updates.startPolling()
	.then(() => {
		_.con('Long Poll запущен');
	})
	.catch((error) => {
		// console.error(error);

		if(error.message && (
			error.message.includes("User authorization failed: invalid session.")
			|| error.message.includes("User authorization failed: user revoke access for this token.")
			)) {
			_.con("RIP Token!", true);
			vk.updates.stop();
			if(_cb) {
				_cb(true);
				_.con("Force stop LP", true);
				return
			}
		}

		// setTimeout(restartLP, 6e4)
	});
}

/*function restartLP() {
	_.con("Перезапуск LongPoll", "red");

	vk.longpoll.restart()
	.then(() => {
		_.con("LongPoll ПЕРЕ запущен", "black", "Cyan")
	})
	.catch((error) => {
		console.error(error);
		setTimeout(restartLP, 6e4)
	});
}*/


module.exports = LongPoll;