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
		// _.con("[sDumper] firtsMessageID: "+firtsMessageID, "cyan");
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
			fs.writeFile(logFile, "", e=> { if(e) throw e; });
		}
	});
	_.con("Plugin [sDumper]", "cyan");
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

	lp.on([ 'new_message', 'edit_message' ], async (context, next) => {
		const { id, peerId, senderId, createdAt: date,
			peerType, forwards, attachments, isOutbox: outbox } = context;
		let { text } = context;
		text = text? text: "";

		const isEdited = context.subTypes.includes("edit_message");

		/* context =>
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
		
		// скипать сообщения групп
		if(peerId < 0)
			return await next();;
		
		// 
		// console.log("M_Before", context);
		await context.loadMessagePayload();
		// console.log("M_After", context);
		
		let sName = await _.getName(senderId),
			chatTitle = false;

		try {
			chatTitle = context.isChat?
				(await vk.api.messages.getChat({
					chat_id: context.chatId
				})).title : "";
		} catch(e) { console.error(e); }

		let dialogName = chatTitle? chatTitle: sName;

		// msg Prefix
		let msgPrfx = "",
		// formate msg
			frmtMsg = msgPrfx+"MSG "+(isEdited? " EDITED": "")+"-("+id+") ";


		frmtMsg += outbox? ("i -> "+sName): ("!"+sName+" -> ");
		frmtMsg += context.isChat? (" @["+chatTitle+"]"): "";
		frmtMsg += ":: \t\n";
		

		let replyTemplate = "",
			forwardsTemplate = "",
			attachmentsArray = [];

		if(context.hasReplyMessage) {
			let { text: _text, id: _id, senderId: _senderId, peerId: _peerId, createdAt: _date } = context.replyMessage;
			
			let _sName = await _.getName(_senderId),
				_outbox = (_senderId==_peerId);
			let _frmtMsg = "reply MSG -("+_id+") ";
			_frmtMsg += _outbox? ("i -> "+_sName): ("!"+_sName+" -> ");
			_frmtMsg += (context.isChat)? (" @["+chatTitle+"]"): "";
			_frmtMsg += ":: \t\n";

			_.con(_frmtMsg+_text, "black", "Green");
			_.fLog(_frmtMsg+_.htmlEntities(_text), "green", date);
			// await _.inVkLog(peerId, dialogName, { senderId, sName, outbox, id, text: _frmtMsg+_text, date: _date, color: "yellow" });

			replyTemplate = _.createReplyMessage({
				replyId: _id,			attachmentType: false,
				senderId: _senderId,	sName: _sName,
				outbox: _outbox,		replyMessage: _.htmlEntities(_text)
			});
		}

		if (context.hasAttachments()) {

			if(context.hasAttachments("sticker")) {
				let stkr = context.getAttachments("sticker")[0],
					// data = "<img src='https://vk.com/images/stickers/"+stkr.id+"/64.png'>";
					data = "<img src='"+stkr.images[0].url+"'>";

				_.fLog(frmtMsg+ data, date);
				_.con(frmtMsg+" {STICKER} - "+ stkr.id, "black", "Green");

				attachmentsArray.push({ content: data });

				// _.inVkLog(peerId, dialogName, { senderId, sName, outbox, id, text: data, date });
			}
			 // Если использовалась подзагрузка смс, то не doc, a audio_message
			else if(context.hasAttachments("audio_message")) {
				let { voices } = await parcAttMessage(context.getAttachments("audio_message"), 0, frmtMsg, { id, peerId, dialogName, outbox }, true);
				attachmentsArray.push({ content: voices });
			}
			else {

				if (!context.hasText) {
					_.con(frmtMsg+". attachments...", "black", "Green");
					_.fLog(frmtMsg+". attachments...", "black", date);
					// await _.inVkLog(peerId, dialogName, { senderId, sName, outbox, id, text: msgPrfx+"attachments...", date, color: "green" });
				}

				let {
					photos, audios, link, types, walls, videos,
					photosArray, audiosArray, linkArray, typesArray, wallsArray, videosArray,
				} = await parcAttMessage(context.getAttachments(), 0, frmtMsg, { id, peerId, dialogName, outbox }, true);
				
				for(let p of photosArray) {
					attachmentsArray.push({
						type: "photo",
						content: "<img src='"+p.smallPhoto+"'>",
						link: p.largePhoto,
						title: "IMG ["+_.dateF(p.createdAt * 1000)+"] "+(p.text? p.text: ""),
					});
				}
				for(let p of audiosArray) {
					attachmentsArray.push({
						type: "audio",
						content: (p.url!=""?
							"<audio controls><source src='"+p.url+"' type='audio/mpeg'></audio>":
							"<b>NO URL AUDIO</b>"),
						title: "Audio title: "+p.artist+" -- "+p.title,
					});
				}

				link!="" && attachmentsArray.push({ content: link,  });
				walls!="" && attachmentsArray.push({ content: walls, });
				types!="" && attachmentsArray.push({ content: types, });
				videos!="" && attachmentsArray.push({ content: videos, });
			}
		}
		else if (context.text == "" && !context.hasForwards) {
			console.log(context);
		}
		

		if (context.hasForwards) {
			_.con(frmtMsg+". FWDS...", "black", "Green");
			_.fLog(frmtMsg+". FWDS...", "black", date);
			// await _.inVkLog(peerId, dialogName, { senderId, sName, outbox, id, text: msgPrfx+"FWDS...", date, color: "green" });

			let formateForwardsArray = [];
			for(let fwd of context.forwards) {
				formateForwardsArray.push(await parcForwardMessage(fwd, { isFwd: true, id, peerId, dialogName, outbox, date }, 0, true, true));
			}

			if(formateForwardsArray.length > 1)
				formateForwardsArray = [ { forwards: formateForwardsArray, title: formateForwardsArray.length+" пересланных сообщения" } ];

			forwardsTemplate = _.createSpoiler(formateForwardsArray);

			// await _.inVkLog(peerId, dialogName, { isFwd: true, senderId, sName, id, date, outbox, /*color: "#ffeb3b", bgColor: "#607d8b",*/ text: ffds });
	
			// console.log(formateForwardsArray);

		}
		

		if (context.hasText) {
			_.con(frmtMsg+text, "black", (isEdited? "Yellow": "Green"))
			_.fLog(frmtMsg+text, (isEdited? "#ffc107": "black"), (isEdited? false: date));
		}

		text = replyTemplate + _.htmlEntities(text) + forwardsTemplate;

		if (/*context.hasText*/ text != "" || attachmentsArray.length > 0) {
			await _.inVkLog(peerId, dialogName, {
				isEdited, senderId, sName, outbox, id, date:(isEdited? _.dateF(): date),
				attachments: attachmentsArray, color: (isEdited? "#ffc107": false),
				text,
			});
		}

		await next();
	});

	// Okay
	lp.on("message_flags", async (context, next) => {
		const { id, peerId, subTypes, flags, isDeleted } = context;
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

		let dialogName = false;
		try {
			dialogName = peerId>2e9?
				(await vk.api.messages.getChat({
					chat_id: peerId-2e9
				})).title : await _.getName(peerId);
		} catch(e) { console.error(e); }

		let msgPrfx = "";

		if(subTypes.includes("set_message_flags") && isDeleted) {
			
			let alld = (flags & 131072)? " ALL": "";
			let text = msgPrfx+"MSG ID "+id+" was deletet"+alld,
				color = "#f44336";
		
			_.con(text, "black", "Red");
			_.fLog(text, color);

			_.inVkLog(peerId, dialogName, { id, color, text, date: _.dateF() });
		}
		else if(subTypes.includes("remove_message_flags") && isDeleted) {
			
			let text = msgPrfx+"MSG ID "+id+" was restored",
				color = "#14433a";
		
			_.con(text, "grey");
			_.fLog(text, color);

			_.inVkLog(peerId, dialogName, { id, color, text, date: _.dateF() });
		}

		await next();
	});
};

async function parcAttMessage(msgAtt, flo, frmtMsg, data, noMode, noConsole) {
	flo = flo || 0;
	frmtMsg = frmtMsg || "";
	noConsole = noConsole || false;
	noMode = noMode || false;

	let r = {
		photos: "", walls: "", videos: "", audios: "", voices: "", link: "", types: "",
		photosArray: [], videosArray: [], wallsArray: [], audiosArray: [], linkArray: [], typesArray: [],
	};

	// console.log("msgAtt", msgAtt);

	try {
		await msgAtt.asyncForEach(async (att)=> {
			try {
				// audiomsg
				if(att.type == "audio_message") {
					let text = "<audio controls><source src='"+att.url+"' type='audio/mpeg'></audio>";

					r.voices += text;
					!noConsole && _.con(frmtMsg+" {AUDIO_MSG} - "+ att.url, "black", "Green");
				}
				else if(att.type == "photo") {
					r.photosArray.push(att);
					r.photos += "<br><a href='"+att.largePhoto+"' target='_blank'>"+(att.text? att.text: "")+"<img src='"+att.smallPhoto+"' title='["+(att.createdAt>0? _.dateF(att.createdAt * 1000): "")+"]'></a>";
					!noConsole && _.con(frmtMsg+" {PHOTO} - "+ att.largePhoto, "black", "Green");
				}

				else if(att.type == "video") {
					r.videosArray.push(att);
					let link = att.player? att.player:
								"https://vk.com/video"+att.ownerId+"_"+att.id+"?hash="+att.accessKey;
					r.videos += "<br><a href='"+link+"' target='_blank'>[VIDEO] "+(att.title? att.title: "")+"</a>";

					!noConsole && _.con(frmtMsg+" {VIDEO} - "+ att.largePhoto, "black", "Green");
				}

				else if(att.type == "wall") {
					r.wallsArray.push(att);

					r.walls += "<br><a href='https://vk.com/wall"+att.ownerId+"_"+att.id+"?hash="+att.accessKey+"' target='_blank'>\
						<b>[WALL] "+att+" ["+(att.createdAt>0? _.dateF(att.createdAt * 1000): "")+"]:</b><br>"+(att.text? att.text: "")+
					"</a>";

					if (att.hasAttachments()) {
						let {
							photos, audios, link, types, walls, videos,
						} = await parcAttMessage(att.getAttachments(), 0, "", { }, true, true);

						let content = photos + audios + link + types + videos + walls,
							attTemplate = _.createSpoiler([ { title: "Вложения записи", content } ]);

						r.walls += attTemplate;
					}

					!noConsole && _.con(frmtMsg+" {WALL} - "+att+' '+att.text, "black", "Green");
				}

				else if(att.type == "audio") {
					let title = "Audio title: "+att.artist+" -- "+att.title;

					r.audios += att.url!=""?
						"<br><audio controls title='"+title+"'><source src='"+att.url+"' type='audio/mpeg'></audio><i>"+title+"</i>":
						"<b>"+title+"</b>";

					r.audiosArray.push(att);

					let audiom = att.url!="" ? (title+"\n [URL]: "+att.url) : ("Audio: "+title);
					!noConsole && _.con(frmtMsg+" {AUDIO} - "+ audiom, "black", "Green");
				}
				else if(att.type == "link") {
					const { url, title } = att;

					r.linkArray.push(att);

					r.link += (url)? ('<br><a href="'+url+'" target="_blank">'+(title? title: url)+'</a>'): (title? title: "ERR-L");
					let linkm = (url)? ('[Link]: '+(title? '('+title+') ': "")+url+''): (title? title: "ERR-L");
					!noConsole && _.con(frmtMsg+" {LINK} - "+ linkm, "black", "Green");
				}
				else {
					r.typesArray.push(att);

					if(att.url)
						r.types += "<br><a href='"+att.url+"' target='_blank'>[DOC] "+(att.title? att.title: att)+"</a>";
					else
						r.types += att;
				}

			} catch (e) {
				console.error("ERR (parcAttMessage) (asyncForEach): ", e);
			}
		});
	} catch (e) {
		console.error("ERR (parcAttMessage): ", e);
	}

	if(msgAtt != null)
		inUData(msgAtt);

	if(noMode == true) {
		return r;
	}


	if(photos != "") _.fLog(frmtMsg+" =MSG =["+flo+"] PHOTOs: "+ photos, "green");
	if(audios != "") _.fLog(frmtMsg+" =MSG =["+flo+"] AUDIOs: "+ audios, "green");

	/*const { peerId, dialogName, isFwd, id, outbox } = data;

	let text = photos+audios;

	if(text != "") {
		text = " =MSG =["+flo+"] "+text;
		await _.inVkLog(peerId, dialogName, { isFwd, id, outbox, color: (voices == ""? "green": ""), text });
	}
	if(voices != "") {
		await _.inVkLog(peerId, { isFwd, id, outbox, text: voices });
	}
	if(link != "") {
		await _.inVkLog(peerId, dialogName, { isFwd, id, outbox, color: "green", text: link });
	}
	if(types != "") {
		await _.inVkLog(peerId, dialogName, { isFwd, id, outbox, color: "green", text: "ZZH Types: "+types });
	}*/

	return r;
}
async function parcForwardMessage(fwd, data, flo, noMode, noConsole) {
	let formateForwardsArray = [],
		formateForwardResult = { };

	flo = flo || 0;
	noMode = noMode || false;
	noConsole = noConsole || false;
	const { isFwd, outbox, peerId, dialogName } = data;
	const { createdAt: date, senderId, forwards } = fwd;
	let { text } = fwd;


	let dots = "";
	for(var i=0;i<flo;i++) dots += ".";

	let sName = await _.getName(senderId),
		frmtMsg = "=MSG =["+flo+"] ("+_.dateF(_.UNIXto(date))+")!"+sName+" -> ";

	text = text?text : "";

	_.con(dots+frmtMsg+text, "black", "Green")
	_.fLog(dots+frmtMsg+text, "#ffeb3b", "#607d8b");

	text = _.htmlEntities(text).replace(/(?:\r\n|\r|\n)/g, '<br>');

	!noMode && await _.inVkLog(peerId, dialogName, { isFwd, sName, date, outbox, color: "#ffeb3b", bgColor: "#607d8b", text: frmtMsg+text });
	
	let {
		photos, audios, voices, link, types, walls, videos,
	} = fwd.hasAttachments?
		await parcAttMessage(fwd.getAttachments(), flo, frmtMsg, { ...data }, noMode, noConsole):
		{ photos: "", audios: "", voices: "", link: "", types: "", walls: "", videos: "", };
	
	formateForwardResult.title = frmtMsg;
	formateForwardResult.content = text + photos + audios + voices + link + types + walls + videos;

	if(flo > 50)
		return _.fLog("FWD LIMITED max 50", "black"), null;
	
	if(forwards.length > 0) {
		flo++;
		for(let dataM of forwards) {
			formateForwardsArray.push(await parcForwardMessage(dataM, data, flo, noMode, noConsole));
		}
	}

	formateForwardResult.forwards = formateForwardsArray;
	return formateForwardResult;
}

Array.prototype.asyncForEach = async function (callback) {
	for (let index = 0; index < this.length; index++) {
		await callback(this[index], index, this);
	}
};

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
};
