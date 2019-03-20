const fs = require('fs');

let izCS = [];

class izCap {
	
	constructor(cachefile = false, saveChanged = true, _h = false) {
		this._ = _h
		
		izCS.push(this)
		this.isExitSave = false
		
		this.cachefile = cachefile;

		if(cachefile) {
			this.cachepath = cachefile+'.json';
			this.saveChanged = saveChanged;
			
			this.arrayCap = {};
			this.loaded = false;
			this.onLoad = [];
			this.load();
		}
	}
	
	addLoad(f) {
		this.onLoad.push(f);
		return this;
	}
	
	async load() {
		let exists = await existsAsync(this.cachepath);
		if(exists) {
			fs.readFile(this.cachepath, (err, data)=> {
				if(err) return console.error(err);

				this.arrayCap = JSON.parse(data.toString());
				this.loaded = true;

				for (var i = this.onLoad.length - 1; i >= 0; i--) {
					this.onLoad[i] && this.onLoad[i]()
				}
			});
		}
		return this;
	}
	
	save(zExit=false, infot=true, _cb=false) {
		fs.writeFile(this.cachepath, JSON.stringify(this.arrayCap, null, '\t'), (err)=> {
			if (err) throw err;

			if(zExit) this.isExitSave = true;

			if (infot) {
				if(this._ && this._.con) this._.con("Saved: "+this.cachefile, "green");
				else if(typeof con == "function") con("Saved: "+this.cachefile, "green");
				else console.log("Saved: "+this.cachefile);
			}
			if(_cb) _cb();
		});

		return this;
	}

	get(data, def) {
		let val = this.arrayCap[data]
		return (val === undefined && def !== undefined) ? def : val;
	}
	set(data, value, ssave=false) {
		this.arrayCap[data] = value
		if(this.saveChanged || ssave)
			this.save(false,ssave);
		return this;
	}
	
	static fastSave(cachefile, value) {
		var _cachepath = cachefile+'.json'
		
		fs.writeFile(_cachepath, JSON.stringify(value, null, '\t'), (err)=> {
			if (err) throw err;
		});
		return this;
	}
	
	static fastLoad(_cb) {
		var _cachepath = cachefile+'.json'
		
		fs.exists(_cachepath, function(exists) {
			if(exists) {
				fs.readFile(_cachepath, function (err, data) {
					if(err) throw err
						_cb(JSON.parse(data.toString()))
				});
			}
			else
				_cb(false)
		});
		return this;
	}
	
	static izCap() {
		return new izCap();
	}
	
	static reizCS() {
		izCS = []
	}
	static izCS() {
		return izCS
	}
	
};


function existsAsync(path) {
	return new Promise( (resolve, reject)=> fs.exists(path, exists=> resolve(exists)) );
}

module.exports = izCap