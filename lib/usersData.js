let izCap, vk;

let userObj = {};

class userData {
	
	static userData(vk, _h, _izCap) {
		return new vkLog(vk, _h, _izCap);
	}
	constructor(_vk, _h, _izCap) {
		vk = _vk;
		izCap = _izCap;

		this.tryLoad();
	}

	tryLoad() {
		if(izCap.loaded) {
			userObj = izCap.get("usersData:userObj", userObj);
		}
		else {
			izCap.addLoad(this.tryLoad);
		}
	}


	async get(uid) {

		// Получаем инфу, если нету
		if (!(uid in userObj)) {
			let data = await this.getAPI(uid, null);
			if(data) {	
				userObj[uid] = {
					data: data[0],
					time: _.getTime()
				}

				this.safeSave();

				return userObj[uid].data;
			}
		}

		// Обновляем инфу, если прошло больше n минут
		if((_.getTime() - userObj[uid].time) > 3600) {
			let data = await this.getAPI(uid, null);
			if(data) {				
				userObj[uid].data = data[0];
				userObj[uid].time = _.getTime();

				this.safeSave();

				return userObj[uid].data;
			}
		}
		
		return (uid in userObj)? userObj[uid].data: false;
	}

	async getAPI(userId) {
		let isGroup = (userId < 0);
		const fields = "name,nickname,domain,sex,bdate,city,country,timezone,photo_50,photo_100,photo_200_orig,has_mobile,contacts,education,online,relation,last_seen,status,can_write_private_message,can_see_all_posts,can_post,universities";
		/*,place,description,wiki_page,members_count,counters,start_date,finish_date,activity,links,fixed_post,verified,site,ban_info,cover*/
		
		let res = false;
		try {
			res = await vk.api.call((isGroup)?'groups.getById':'users.get', {
				user_ids: userId,
				group_ids: userId*(-1),
				fields
			});
		} catch(e) { console.error(e); }

		return res;
	}

	async getFast(user_ids, fields = "has_mobile,online,last_seen") {
		return await vk.api.call('users.get', {
			user_ids,
			fields
		});
	}

	safeSave(zExit = false) {
		izCap.set("usersData:userObj", userObj);
		izCap.save(zExit, false);
	}
}

module.exports = userData;