const fs = require('fs');

let vk, _;

/*
*		sDumper - дампит сообщения
*/


var firtsMessageID = -1;

var logFile = false
function tryLoad() {
	if(_.izCapData.loaded) {
		firtsMessageID = _.izCapData.get("pl:sDumper:firtsMessageID", firtsMessageID);
		_.con("User DATA Loaded [sDumper]", "cyan");
		_.con("[sDumper] firtsMessageID: "+firtsMessageID, "cyan");
	}
	else
		_.izCapData.addLoad(tryLoad)
}
function tryLog() {
	var path = "./data/log/"+_.UID;
	logFile = path+"/"+_.genName()+'.json'
	
	if (!fs.existsSync(path))
		fs.mkdirSync(path);
	
	fs.exists(logFile, function(exists) {
		if(!exists) {
			fs.writeFile(logFile, "", (error) => { if(error) throw error; });
		}
	});
	// _.con("Plugin [sDumper]", "cyan");
}

function inUData(data) {
	if(logFile)
		fs.appendFileSync(logFile, JSON.stringify(data, null, '\t') +"\n");
}
module.exports = (_vk, _h) => {
	_ = _h;
	vk = _vk;
	let lp = _vk.updates;
	
	tryLoad();
	tryLog();
	
	lp.use(async (context, next) => {
		next()
		// console.log("USE", context);
	});

	lp.on([ 'new_message' ], async (context, next) => {
		next()
		// console.log(context);

		/*
			MessageContext { 
				id: 441703,
				conversationMessageId: null,
				peerId: 2000000077,
				peerType: 'chat',
				senderId: 4984545,
				senderType: 'user',
				createdAt: 1547409445,
				text: 'https://vk.com/video-1231',
				forwards: MessageForwardsCollection [],
				attachments: [],
				isOutbox: false,
				type: 'message',
				subTypes: [ 'new_message', 'text' ],
				state: {}
			}
		*/
		const { id, peerId, senderId, createdAt: date,
			peerType, forwards, attachments, isOutbox: outbox } = context;
		let { text } = context;
		const title = "";

		if(peerId < -10000)
			return;
		/*		
		if(firtsMessageID == -1 && !message.PTSSAVER) {
			firtsMessageID = message.id;
			_.izCapData.set("pl:sDumper:firtsMessageID", firtsMessageID).save(false, false);
		}
		else if(message.PTSSAVER && firtsMessageID != -1 && firtsMessageID >= message.id) {
			_.izCapData.set("pl:sDumper:firtsMessageID", -1).save(false, false);
			return console.log("FFFFFFFFFFFFFFFFFFFFFFFFFF");
		}
		*/

		text = (text === null)? "": text;
				
		var sName = _.getName(senderId);
		
		var smms = "";//message.PTSSAVER?"RAR_["+_.dateF(_.UNIXto(message.date))+"] ":"";
		var chh = (peerType == 'chat' && title!="")?("CHNL "+title):"";
		var ftms = smms+"MSG -("+id+") ";

		let dialogName = (peerType == 'chat' && title != "")? title: sName; 

		if(outbox)
			ftms += "i -> "+sName+" "+chh+":: \t\n";
		else
			ftms += "!"+sName+" ->  "+chh+":: \t\n";

		
		if (context.hasAttachments()) {

			if(context.hasAttachments("sticker")) {
				var idd = context.getAttachments("sticker")[0].id;
				var data = "<img src='https://vk.com/images/stickers/"+idd+"/64.png'>";
				_.fLog(ftms+ data, date);
				_.con(ftms+" {STICKER} - "+ idd, "black", "Green");

				_.inVkLog(peerId, dialogName, { userID: senderId, outbox, id, text: data, date });
			}
			/*else {
				let isAudio = message.attachments.doc && message.attachments.doc[0] && message.attachments.doc[0].type=="audiomsg";

				if (message.text == "" && !isAudio) {
					_.con(ftms+". attachments...", "black", "Green");
					_.fLog(ftms+". attachments...", "black", message.date);
					_.inVkLog(message.peer, dialogName, { userID: message.user, outbox, id: message.id, text: smms+"attachments...", date: message.date });
				}

				if(message.attachmentsPTS) {
					await parcAttMessage(message.attachmentsPTS, 0, ftms, { id: message.id, peer: message.peer, dialogName, outbox });
				}
				else {
					vk.api.messages.getById({
						message_ids: message.id
					})
					.then(async (data1) => {
						for(let data of data1.items) {
							await parcAttMessage(data, 0, ftms, { id: message.id, peer: message.peer, dialogName, outbox });
						}
					});
					
				}
			}*/
		}
		/*else if (message.text == "" && !message.hasFwd()) {
			console.log(message);
		}
		

		if (message.hasFwd()) {
			_.con(ftms+". FWDS...", "black", "Green");
			_.fLog(ftms+". FWDS...", "black", message.date);
			_.inVkLog(message.peer, dialogName, { userID: message.user, outbox, id: message.id, text: smms+"FWDS...", date: message.date });

			if(message.fwd_messages) {
				for(let dataM of message.fwd_messages) {
					await parcForwardMessage(dataM, { isFwd: true, id: message.id, peer: message.peer, dialogName, outbox });
				}
			}
			else {
				vk.api.messages.getById({
					message_ids: message.id
				})
				.then(async (data)=> {
					for(let dataM of data.items[0].fwd_messages) {
						await parcForwardMessage(dataM, { isFwd: true, id: message.id, peer: message.peer, dialogName, outbox });
					}
				});
			}
		}
		*/

		if (text == "")
			return;
		
		_.con(ftms+text, "black", "Green")
		_.fLog(ftms+text, "black", date);
		_.inVkLog(peerId, dialogName, { userID: senderId, outbox, id, text, date });
		
	});



	lp.on("typing", async (context, next) => {
		next()
		/*
			TypingContext {
				fromId: 169359093,
				toId: 2000000077,
				chatId: 77,
				isUser: true,
				isGroup: false,
				isChat: true,
				isTyping: true,
				isAudioMessage: false,
				type: 'typing',
				subTypes: [ 'typing_user' ],
				state: {}
			}
		*/
	});


	// Okay
	lp.on([ 'edit_message' ], async (context, next) => {
		next();
		// console.log("edit_message", context);
		/*
			MessageContext {
				id: 441703,
				conversationMessageId: null,
				peerId: 2000000077,
				peerType: 'chat',
				senderId: 505188266,
				senderType: 'user',
				createdAt: 1547409445,
				text: 'https://vk.com/video-57876954_456278145',
				forwards: MessageForwardsCollection [],
				attachments: [ VideoAttachment <video-57876954_456278145> {} ],
				isOutbox: false,
				type: 'message',
				subTypes: [ 'video', 'edit_message', 'text' ],
				state: {}
			}
		*/
		const { id, isOutbox: outbox, /*createdAt: date,*/ senderId, peerId, text, peerType } = context;
		const title = "", smms = "";
		// var smms = message.PTSSAVER? "RAR_["+_.dateF(_.UNIXto(date))+"] ": "";
		
		if (text == null) return;
		
		let sName = _.getName(senderId);
		let dialogName = (peerType == 'chat' && title != "")? title: sName; 

		var chh = (peerType == 'chat' && title!="")?("CHNL "+title):"";
		var ftms = (outbox?("i -> "+sName):("!"+sName+" -> "))+" "+chh+":: \t\n"+text;

		_.con("MSG EDITED -("+id+") "+ ftms, "black", "Yellow")
		_.fLog(smms+"MSG EDITED -("+id+") "+ ftms, "#ffc107");

		_.inVkLog(peerId, dialogName, { edited: true, userID: senderId, outbox, id, text: smms+text, color: "#ffc107", date: _.dateF() });
	});
	// Okay
	lp.on("message_flags", async (context, next) => {
		next()
		// console.log("message_flags", context);
		/*
			MessageFlagsContext {
				id: 441926,
				peerId: 2000000047,
				flags: 128,
				type: 'message_flags',
				subTypes: [ 'set_message_flags' ],
				state: {}
			}
		*/
		// context.isDeleted

		/*
			MessageFlagsContext {
				id: 441919,
				peerId: 2000000047,
				flags: 131200,
				type: 'message_flags',
				subTypes: [ 'set_message_flags' ],
				state: {}
			}
		*/
		// (context.flags & 131072) // Delete for All

		// context.subTypes.includes("remove_message_flags") && context.isDeleted // Restore


		var smms = ""; //message.PTSSAVER?"RAR_["+_.dateF(_.UNIXto(message.date))+"] ":"";

		if(context.subTypes.includes("set_message_flags") && context.isDeleted) {
			
			var alld = (context.flags & 131072)? " ALL": "";
			let text = smms+"MSG ID "+context.id+" was deletet"+alld,
				color = "#f44336";
		
			_.con(text, "red");
			_.fLog(text, color);

			_.inVkLog(context.peerId, "...", { id: context.id, color, text, date: _.dateF() });
		}
		else if(context.subTypes.includes("remove_message_flags") && context.isDeleted) {
			
			let text = smms+"MSG ID "+context.id+" was restored",
				color = "#14433a";
		
			_.con(text, "grey");
			_.fLog(text, color);

			_.inVkLog(context.peerId, "...", { id: context.id, color, text, date: _.dateF() });
		}
	});
};

async function parcAttMessage(msgAtt, flo, ftms, data) {
	try {
		flo = flo||0;
		ftms = ftms||"";

		// console.log("msgAtt", msgAtt);

		var audios = ""
			, photts = ""
			, types = ""
			, link = ""
			, voices = "";

		if(msgAtt.attachments) {
			msgAtt.attachments.forEach((att)=> {
				try {
					// audiomsg
					if(att.type == "doc" && att.doc.type == 5) {
						var dataA = att.doc
						, srcA = dataA.url!==undefined?dataA.url : "#"
						, text = "<audio controls><source src='"+srcA+"' type='audio/mpeg'></audio>";
						
						voices += text;

						_.fLog(ftms+ data, "green");
						// _.inVkLog(data.peer, data.dialogName, { outbox: data.outbox, text, color: "green" });
			
						_.con(ftms+" {AUDIO_MSG} - "+ srcA, "black", "Green");
						if(att.doc.preview && att.doc.preview.audio_msg && att.doc.preview.audio_msg.waveform) {
							att.doc.preview.audio_msg.waveform = ["zip"];
						}
					}
					else if(att.type == "photo") {
						photts += "<a href='"+vk.getLargePhoto(att.photo)+"' target='_blank'>IMG ["+(att.photo.date>0?(_.dateF(att.photo.date * 1000)):"...")+"] "+att.photo.text+"<img src='"+vk.getSmallPhoto(att.photo)+"'></a><br>";
						_.con(ftms+" {PHOTO} - "+ vk.getLargePhoto(att.photo), "black", "Green");
					}
					else if(att.type == "audio") {
						var au = att.audio;
						var title = "Title: "+au.artist+" -- "+au.title;

						audios += au.url!="" ? "<audio controls title='"+title+"'><source src='"+au.url+"' type='audio/mpeg'></audio><i>"+title+"</i>":"<b>Audio: "+au.artist+" -- "+au.title+"</b><br>";
						var audiom = au.url!="" ? (title+"\n [URL]: "+au.url) : ("Audio: "+title);
						_.con(ftms+" {AUDIO} - "+ audiom, "black", "Green");
					}
					else if(att.type == "link") {
						const { url, title } = att.link;

						link = (url && url!="")? '<a href="'+url+'" target="_blank">'+(title? title: url)+'</a>': (title? title: "ERR-L");
						var linkm = (url && url!="")? '[Link]: '+(title? '('+title+') ': "")+url+'': (title? title: "ERR-L");
						_.con(ftms+" {LINK} - "+ linkm, "black", "Green");
					}
					else {
						types += att.type+", ";
						console.log(att)
					}

				} catch (e) {
					console.error("ERR (parcAttMessage) (forEach): ", e);
				}
			});
		}
		
		if(msgAtt != null)
			inUData(msgAtt);

		if(photts != "") _.fLog(ftms+" =MSG =["+flo+"] PHOTOs: "+ photts, "green")
		if(audios != "") _.fLog(ftms+" =MSG =["+flo+"] AUDIOs: "+ audios, "green")

		let text = photts+audios;

		if(text != "") {
			text = " =MSG =["+flo+"] "+(photts!=""? "PHOTOs": "AUDIOs")+": "+text;
			await _.inVkLog(data.peer/*msgAtt.peer_id*/, data.dialogName, { isFwd: data.isFwd, id: data.id, outbox: data.outbox, color: "green", text });
		}
		if(voices != "") {
			await _.inVkLog(data.peer, data.dialogName, { isFwd: data.isFwd, id: data.id, outbox: data.outbox, color: "green", text: voices });
		}
		if(link != "") {
			await _.inVkLog(data.peer, data.dialogName, { isFwd: data.isFwd, id: data.id, outbox: data.outbox, color: "green", text: link });
		}
		if(types != "") {
			await _.inVkLog(data.peer, data.dialogName, { isFwd: data.isFwd, id: data.id, outbox: data.outbox, color: "green", text: "ZZH Types: "+types });
		}

	} catch (e) {
		console.error("ERR (parcAttMessage): ", e);
	}
}
async function parcForwardMessage(fwd, data, flo) {
	flo = flo||0;

	var _sName = _.getName(fwd.user_id || fwd.from_id);
	
	var dots = ""
	// console.log(fwd)
	for(var i=0;i<flo;i++) dots += ".";
	
	var ftms = dots+"=MSG =["+flo+"] ("+_.dateF(_.UNIXto(fwd.date))+")!"+_sName+" ->  "+(fwd.body || fwd.text);
	
	_.con (ftms, "black", "Green")
	_.fLog(ftms, "#ffeb3b", "#607d8b");
	await _.inVkLog(data.peer, data.dialogName, { isFwd: data.isFwd, id: false, date: fwd.date, outbox: data.outbox, color: "#ffeb3b", bgColor: "#607d8b", text: ftms });
	
	await parcAttMessage(fwd, flo, ftms, { ...data, id: false });
	
	if(flo > 50)
		return _.fLog("FWD LIMITED max 50", "black")
	
	if(fwd.fwd_messages !== undefined) {
		flo++;
		for(let dataM of fwd.fwd_messages) {
			await parcForwardMessage(dataM, data, flo);
		}
	}
}


