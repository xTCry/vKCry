const fs = require('fs');

const directory = "./data/tokens/"

class black_auth {

	constructor(autoLoad = true) {
		if(autoLoad) {			
			this.arrayData = [];
			this.objectData = {};
			
			this.isEnd = 0;
			this.endCount = 0;
			this.loaded = false;
			this.onLoad = ()=> { console.log("no listener LOADED"); };
			
			this.load()
		}
		return this;
	}
	
	addLoad(f) {
		this.onLoad = f;
		return this;
	}
	
	load() {
		var self = this;
		
		fs.readdir(directory, function(err, files) {
			if(!files || files.length == 0) {
				console.log("NULL Tokens");
				self.loaded = true;
				if(self.onLoad) self.onLoad()
				return;
			}

			files
			.map(function(v) { 
				return {
					name: v,
					// С первого раза не в том порядке... нужен перезапуск
					time: fs.statSync(directory + v).mtime.getTime()
				}; 
			})
			.sort(function(a, b) {
				return a.time - b.time;
			})
			.map(function(v) {
				return v.name;
			})
			.forEach((file, key) => {
							
				if(file == "old")
					return;
				
				self.endCount++;
				
				fs.readFile(directory + '/' + file, function (err, data) {
					if(err) return console.error(err)
					
					var jsonData = JSON.parse(data.toString())
					
					self.arrayData.push( jsonData )
					
					self.objectData["id"+jsonData.id] = jsonData
					
					self.isEnd++;
					if(self.isEnd >= self.endCount) {
						self.loaded = true;
						if(self.onLoad)
							self.onLoad()
					}
				});
			})
		});
		
		return this;
	}

	getArray(data=false) {
		if(!data)
			return this.arrayData
		
		return this.arrayData[data] || false
	}
	get(data=false) {
		return this.getObject(data)
	}
	getObject(data=false) {
		if(!data)
			return this.objectData
		
		return this.objectData[data] || false
	}

	static black_auth() {
		return new black_auth();
	}
};

module.exports = black_auth