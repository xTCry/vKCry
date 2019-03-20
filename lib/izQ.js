var sqlite3 = require('sqlite3').verbose();
var phpdate = require('phpdate-js');
var _, load = false

class izQ {
	constructor(_h, fName) {
		_ = _h
		this.db = new sqlite3.Database('./cache/'+fName+'.db', () => {
			load = true;
			this.db.prepare("CREATE TABLE IF NOT EXISTS stats_online (ID INTEGER PRIMARY KEY AUTOINCREMENT, uid INT, online INT, time INT, name VARCHAR(150), status VARCHAR(250), date DATETIME);").run();
		});
	}

	RecOnline(uid, online, time=false, name="", status="") {
		if(!load) {
			return setTimeout(()=> {
				this.RecOnline(uid, online, time, name, status)
			}, 1000)
		}
		if(!time)
			time = _.getTime();
		status = status.replace("\"", "'");
		var date = phpdate("Y-m-d H:i:s", _.UNIXto(time));
				
		this.db.prepare("INSERT INTO stats_online (uid, online, status, time, date, name) VALUES (?,?,?,?,?,?)")
			.run(uid, online, status, time, date, name)
			.finalize(function(err) {
				if (err)
					console.error(err);
			});

		//sql = "INSERT INTO stats_online (uid, online, status, time, date, name) VALUES ("+uid+", "+online+", \""+status+"\", "+time+", \""+date+"\", \""+name+"\");";
		//ret = this->db->exec(sql);
	}
	

	static izQ(_h, fName) {
		return new izQ(_h, fName);
	}
};

module.exports = izQ;