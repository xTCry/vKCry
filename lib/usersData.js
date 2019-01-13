var _,
izCap

var userObj = {}

module.exports = function(vk, _h, _izCap) {
	_ = _h
	izCap = _izCap
	var self = this
	
	this.get = function(uid, _cb) {
		_cb = _cb || false;
		
		var self = this;
		
		// Получаем инфу, если нету
		if (!(uid in userObj)) {
			this.getAPI(uid, null, (data) => {
				
				userObj[uid] = {
					data: data[0],
					time: _.getTime()
				}
				
				if(_cb) _cb(userObj[uid].data)
					self.safeSave()
				
			})
            return undefined //-1;
        }
        
		// Обновляем инфу, если прошло больше n минут
		if((_.getTime() - userObj[uid].time) > 3600) {
			this.getAPI(uid, null, (data) => {
				
				userObj[uid].data = data[0];
				userObj[uid].time = _.getTime();
				
				if(_cb) _cb(userObj[uid].data)
					self.safeSave()
				
			})
			if(_cb) return undefined //-2;
		}
		
		if(_cb) _cb(userObj[uid].data)
			return userObj[uid].data;
		
	}

	this.getAPI = function(userId, isGroup, _cb) {
		isGroup = isGroup || false

		if(userId < 0)
			userId *= -1; 
		vk.api.call((isGroup)?'groups.getById':'users.get', {
			user_ids: userId,
			group_ids: userId,
			fields: "nickname,domain,sex,bdate,city,country,timezone,photo_50,photo_100,photo_200_orig,has_mobile,contacts,education,online,relation,last_seen,status,can_write_private_message,can_see_all_posts,can_post,universities"
			/*,place,description,wiki_page,members_count,counters,start_date,finish_date,activity,links,fixed_post,verified,site,ban_info,cover*/
		})
		.then(_cb)
		.catch((error) => {
			console.error(error);
		});
	}

	this.getFast = function(userId, _cb) {
		
		vk.api.call('users.get', {
			user_ids: userId,
			fields: "has_mobile,online,last_seen"
		})
		.then(_cb)
		.catch((error) => {
			console.error(error);
		});
	}

	this.tryLoad = function() {
		
		if(izCap.loaded) {
			userObj = izCap.get("usersData:userObj", userObj)
			// console.log("");
			// _.con("Users Loaded ", "cyan");
		}
		else
			izCap.addLoad(this.tryLoad)
	}
	
	this.safeSave = function(zExit) {
		izCap.set("usersData:userObj", userObj)
		// izCap.save(zExit, zExit)
	}
	
	this.tryLoad();
	
}