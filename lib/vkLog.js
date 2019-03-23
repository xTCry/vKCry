const fs = require('fs'),
	path = require('path'),
	{ promisify } = require("util");;

const cachedir = "./data/";

class vkLog {
	
	static vkLog(peerId, cacheFolder) {
		return new vkLog(peerId, cacheFolder);
	}
	constructor(peerId, cacheFolder="vk", customPath=false) {
		this.cDialogs = {};

		this.peerId = peerId;

		if(customPath) this.cPath = cachedir + cacheFolder+ "/" + customPath + "/";
		else this.cPath = cachedir + cacheFolder + "/" + peerId + "/";

		try {
			if (!fs.existsSync(this.cPath))
				mkdirAsync(this.cPath).then();
		} catch(e) { }
	}
	
	async _initDalogFile(dialogID, dialogName, fileID=false) {

		// let cFile = this.cPath + dialogID + (fileID? "_"+fileID: "") + '.html';

		let nPath = this.cPath + dialogID + "/",
			nFile = "messages" + (fileID? fileID: "") + '.html',
			cFile = nPath + nFile;

		try {
			if (!await existsAsync(nPath))
				await promisify(fs.mkdir)(nPath);
		} catch(e) { }

		if(!this.cDialogs[dialogID] || this.cDialogs[dialogID] != cFile) {
			this.cDialogs[dialogID] = cFile;

			let exists = await existsAsync(cFile);
			if(!exists) {
				let template = templateDialog.replace(/{DialogName}/gi, dialogName);

				let errWrite = await writeFileAsync(cFile, template);
				if (errWrite) throw errWrite;
				console.log('vkLog Dialog file created: ['+nFile+']');

			}
		}

		return cFile;
	}

	ddef(data) {

		if(typeof data === "string")
			data = { text: data };

		data.text = data.text || "";
		data.id = data.id || false;
		data.isFwd = data.isFwd || false;
		data.isEdited = data.isEdited || false;
		data.outbox = data.outbox || false;
		data.attachment = data.attachment || false;
		data.sName = data.sName || false;
		data.senderId = data.senderId || 0;
		data.color = data.color || "black";
		data.bgColor = data.bgColor || "black";

		data.date = (data.date && !isNaN(data.date))? _.dateF(data.date): (data.date? data.date: "");
		// data.text = data.text.replace(/(?:\r\n|\r|\n)/g, '<br>');

		return data;
	}
	async insertMessage(dialogID, dialogName, data, fileID=false) {
		fileID = fileID || _.genUX();
		let cFile = await this._initDalogFile(dialogID, dialogName, fileID);

		let { id, text, attachments, date, senderId, outbox, isEdited, isFwd, sName, color, bgColor } = this.ddef(data);

		let style = (color != "black")? 'style="background:'+ bgColor +'"': "";

		let MessageContent = text;
	
		if(style != "")
			MessageContent = '<font color="'+color+'" '+style+'>'+MessageContent+'</font>';

		if(attachments) {
			if(!Array.isArray(attachments) && typeof data === "object")
				attachments = [ attachments ];

			for(let att of attachments) {

				let tcontent = att.link?
							"<a class='attachment__link' href='{ATT:Link}' target='_blank'>{ATT:ContentNext}</a>":
							"{ATT:ContentNext}";

				MessageContent += templateDialogItemAttachment
					.replace(/{ATT:Content}/gi, tcontent)
					.replace(/{ATT:ContentNext}/gi, att.content)
					.replace(/{ATT:Link}/gi, (att.link? att.link: ""))
					.replace(/{ATT:Type}/gi, (att.type? att.type: ""))
					.replace(/{ATT:Title}/gi, (att.title? att.title: ""));
			}
		}
		
		let okLink = senderId>0 && senderId<2e9;

		let MessageUser = (outbox? "Вы": (okLink? '<a href="{LinkSenderId}" target="_blank">{SenderName}</a>': "<i>{SenderName}</i>")),
			MessageEdited = (isEdited? '<span class="message-edited" onclick="document.getElementById("mid{MessageID}").scrollIntoView();"> (ред.)</span>': "");

		let template = templateDialogItem
						.replace(/{ClassItem}/gi, (isFwd? " fwd":""))
						.replace(/{MessageUser}/gi, MessageUser)
						.replace(/{MessageEdited}/gi, MessageEdited)
						.replace(/{LinkSenderId}/gi, (okLink? "https://vk.com/id"+senderId: "#"))
						.replace(/{SenderName}/gi, (sName? sName: "ZZH-"+senderId))
						.replace(/{MessageDate}/gi, date)
						.replace(/{MessageID}/gi, (id? id: ""))
						.replace(/{MessageContent}/gi, MessageContent);

		await appendFileAsync(cFile, template);

		return cFile;
	}

	async insertPagens(cFile, data) {
		let template = this.getPagen(data.pagens);

		await appendFileAsync(cFile, template);
	}
	getPagen(pagens) {
		let templatePagens = "";

		for(let pp of pagens)
			templatePagens += templatePagenA
					.replace(/{_SEL}/gi, (pp.isSel? "_sel": ""))
					.replace(/{FID}/gi, pp.fileID);

		let template = templatePagen
					.replace(/{PAGENS}/gi, templatePagens);

		return template;
	}

	replyMessage(data) {
		let { replyId, attachment, senderId, sName, outbox, replyMessage } = data;

		let okLink = senderId>0 && senderId<2e9;
		let MessageUser = (outbox? "Вы": (okLink? '<a href="{RPLY:LinkSenderId}" target="_blank">{RPLY:SenderName}</a>': "<i>{RPLY:SenderName}</i>"));
		
		let content = attachment && attachment.type && attachment.title?
						"<span class='im-page-pinned--media'>"+attachment.title+"</span>":
						replyMessage? replyMessage: "...";
		let PON = attachment.type == "photo"? '<div class="im-replied--photo" style="background-image: url('+attachment.url+')"></div>':
				attachment.type == "video"? '<div class="im-replied--photo im-replied--photo_video" style="background-image: url('+attachment.url+')"></div>':
				attachment.type == "doc"? '<div class="im-replied--photo im-replied--photo_'+attachment.subType+'"></div>':
					"";

		let template = templateReplyMessage
					.replace(/{RPLY:RepliedMessageID}/gi, replyId)
					.replace(/{RPLY:MessageUser}/gi, MessageUser)
					.replace(/{RPLY:Content}/gi, content)
					.replace(/{RPLY:LinkSenderId}/gi, (okLink? "https://vk.com/id"+senderId: "#"))
					.replace(/{RPLY:SenderName}/gi, (sName? sName: "ZZH-"+senderId))
					.replace(/{RPLY:PHOTO_OR_NO}/gi, PON)
					.replace(/{RPLY:Message}/gi, "");

		return template;
	}

	createSpoiler(data) {
		let templateTemp = this.formateSpoiler(data);

		let template = templateSpoilerDIV
					.replace(/{SPOILER_DIV_CONTENT}/gi, templateTemp);

		return template;
	}
	formateSpoiler(data, q=false) {
		let template = "";

		for(let spoiler of data) {
			let forwards = ("forwards" in spoiler)? spoiler.forwards: false;
			let content = spoiler.content? spoiler.content: "";

			if(Array.isArray(forwards) && forwards.length > 0)
				content += "<br>"+this.formateSpoiler(forwards, true);

			template += templateSpoiler
				.replace(/{SPOILER_OPEN}/gi, (spoiler.isOpen || q? "open": ""))
				.replace(/{SPOILER_CONTENT}/gi, content)
				.replace(/{SPOILER_TITLE}/gi, spoiler.title);
		}

		return template;
	}
};

function existsAsync(path) {
	return new Promise( (resolve, reject)=> fs.exists(path, exists=> resolve(exists)) );
}
function writeFileAsync(path, data) {
	return new Promise( (resolve, reject)=> fs.writeFile(path, data, err=> resolve(err)) );
}
function appendFileAsync(path, data) {
	return new Promise( (resolve, reject)=> fs.appendFile(path, data, err=> resolve(err)) );
}

function mkdirAsync(path) {
	return new Promise( (resolve, reject)=> {

		try {
			path = path.replace(/\/$/, '').split('/');
			for (var i = 1; i <= path.length; i++) {
				var segment = path.slice(0, i).join('/');
				(segment.length > 0 && !fs.existsSync(segment)) ? fs.mkdirSync(segment) : null ;
			}
		} catch(e) { }

		resolve();
	});
}


const templateDialog = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>VK Dialog - {DialogName}</title>

		<style type="text/css">

			/* Replied */
			.im-replied{
				position:relative;
				padding:0 0 0 10px;
				white-space:nowrap;
				font-family:-apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif;
				cursor:pointer;
				display:-ms-flexbox;
				display:flex;
				margin:5px 0 7px
			}
			.im-replied:before{
				position:absolute;
				top:3px;
				bottom:0;
				left:0;
				width:2px;
				background:#dee6ee;
				border-radius:1px;
				content:''
			}
			.im-replied:hover:before{
				background:#a3bbd6
			}
			.im-replied--photo-wrapper{
				width:34px;
				height:34px;
				-ms-flex:0 0 34px;
				flex:0 0 34px;
				margin:3px 8px 0 -2px
			}
			.im-replied--photo-wrapper:empty{
				display:none
			}
			.im-replied--photo{
				position:relative;
				width:34px;
				height:34px;
				border-radius:4px;
				background-size:cover;
				background-position:50%;
				overflow:hidden
			}
			.im-replied--photo_video:before{
				position:absolute;
				top:0;
				right:0;
				bottom:0;
				left:0;
				background:rgba(0,0,0,.24);
				content:''
			}
			.im-replied--photo_video:after{
				position:absolute;
				top:50%;
				left:50%;
				width:0;
				height:0;
				border:5px solid transparent;
				border-left:9px solid #fff;
				border-right:0;
				margin:-5px 0 0 -4px;
				content:''
			}
			.im-replied--photo_text{
				background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2034%2034%22%3E%3Crect%20width%3D%2234%22%20height%3D%2234%22%20rx%3D%226%22%20ry%3D%226%22%20fill%3D%22%235c9ce6%22%2F%3E%3Cpath%20d%3D%22M10%2C23a1%2C1%2C0%2C0%2C1%2C1-1h6a1%2C1%2C0%2C0%2C1%2C0%2C2H11A1%2C1%2C0%2C0%2C1%2C10%2C23Zm0-4a1%2C1%2C0%2C0%2C1%2C1-1H23a1%2C1%2C0%2C1%2C1%2C0%2C2H11A1%2C1%2C0%2C0%2C1%2C10%2C19Zm0-4a1%2C1%2C0%2C0%2C1%2C1-1H23a1%2C1%2C0%2C1%2C1%2C0%2C2H11A1%2C1%2C0%2C0%2C1%2C10%2C15Zm0-4a1%2C1%2C0%2C0%2C1%2C1-1H23a1%2C1%2C0%2C1%2C1%2C0%2C2H11A1%2C1%2C0%2C0%2C1%2C10%2C11Z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E')
			}
			.im-replied--photo_archive{
				background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2034%2034%22%3E%3Crect%20width%3D%2234%22%20height%3D%2234%22%20rx%3D%226%22%20ry%3D%226%22%20fill%3D%22%234bb34b%22%2F%3E%3Cpath%20d%3D%22M14%2C2h3V4H14Zm3%2C2h3V6H17ZM14%2C6h3V8H14Zm3%2C2h3v2H17Zm-3%2C2h3v2H14Zm3%2C2h3v2H17Zm-3%2C2h3v2H14Zm2.5%2C4h1l2%2C3.15c.29.47.08.85-.46.85H15c-.55%2C0-.75-.38-.46-.85Z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E')
			}
			.im-replied--photo_pic{
				background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2034%2034%22%3E%3Crect%20width%3D%2234%22%20height%3D%2234%22%20rx%3D%226%22%20ry%3D%226%22%20fill%3D%22%235c9ce6%22%2F%3E%3Cpath%20d%3D%22M25.42%2C21.4c.83%2C1.44.16%2C2.6-1.49%2C2.6H10.08c-1.65%2C0-2.19-1.07-1.21-2.4l2.43-3.27a1.54%2C1.54%2C0%2C0%2C1%2C2.51-.09L15%2C19.61a.73.73%2C0%2C0%2C0%2C1.22-.08l3.27-4.79a1.16%2C1.16%2C0%2C0%2C1%2C2.13.08ZM12%2C14a2%2C2%2C0%2C1%2C1%2C2-2A2%2C2%2C0%2C0%2C1%2C12%2C14Z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E')
			}
			.im-replied--photo_audio{
				background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2034%2034%22%3E%3Crect%20width%3D%2234%22%20height%3D%2234%22%20rx%3D%226%22%20ry%3D%226%22%20fill%3D%22%23aa65f0%22%2F%3E%3Cpath%20d%3D%22M15%2C22.92a2.87%2C2.87%2C0%2C0%2C1-2.44%2C2.69C10.9%2C26%2C9.35%2C25.24%2C9%2C24s.77-2.64%2C2.4-3a3.61%2C3.61%2C0%2C0%2C1%2C1.52%2C0V12.77a1.38%2C1.38%2C0%2C0%2C1%2C1-1.26L23%2C9a.72.72%2C0%2C0%2C1%2C1%2C.75V20.91a2.86%2C2.86%2C0%2C0%2C1-2.44%2C2.71C19.9%2C24%2C18.35%2C23.24%2C18%2C22s.77-2.64%2C2.4-3a3.61%2C3.61%2C0%2C0%2C1%2C1.52%2C0V13.27l-7%2C2Z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E')
			}
			.im-replied--photo_videofile{
				background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2034%2034%22%3E%3Crect%20width%3D%2234%22%20height%3D%2234%22%20rx%3D%226%22%20ry%3D%226%22%20fill%3D%22%23e64646%22%2F%3E%3Cpath%20d%3D%22M9%2C13a2%2C2%2C0%2C0%2C1%2C2-2h9a2%2C2%2C0%2C0%2C1%2C2%2C2v8a2%2C2%2C0%2C0%2C1-2%2C2H11a2%2C2%2C0%2C0%2C1-2-2ZM23.5%2C15.5l2.69-1.92c.45-.32.81-.13.81.42v6c0%2C.55-.36.74-.81.42L23.5%2C18.5Z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E')
			}
			.im-replied--photo_book{
				background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2034%2034%22%3E%3Crect%20width%3D%2234%22%20height%3D%2234%22%20rx%3D%226%22%20ry%3D%226%22%20fill%3D%22%23ffa000%22%2F%3E%3Cpath%20d%3D%22M16.5%2C12.91V24c0-1.08-2.13-2.31-4.29-2.5a5%2C5%2C0%2C0%2C0-3.8%2C1.42h0A.25.25%2C0%2C0%2C1%2C8%2C22.73V14c0-.05%2C0-1.95%2C0-2%2C.09-1%2C2-2.17%2C4.21-2s4.29%2C1.42%2C4.29%2C2.47C16.5%2C12.62%2C16.5%2C12.76%2C16.5%2C12.91Zm1%2C0c0-.15%2C0-.29%2C0-.41%2C0-1.06%2C2.1-2.28%2C4.29-2.47S25.91%2C11%2C26%2C12c0%2C.05%2C0%2C.95%2C0%2C1v9.73a.25.25%2C0%2C0%2C1-.41.19h0a5%2C5%2C0%2C0%2C0-3.8-1.42c-2.16.19-4.25%2C1.43-4.29%2C2.5Z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E')
			}
			.im-replied--photo_doc{
				background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2034%2034%22%3E%3Crect%20width%3D%2234%22%20height%3D%2234%22%20rx%3D%226%22%20ry%3D%226%22%20fill%3D%22%2399a2ad%22%2F%3E%3Cpath%20d%3D%22M10%2C11.47V22.53A2.47%2C2.47%2C0%2C0%2C0%2C12.47%2C25h9.06A2.47%2C2.47%2C0%2C0%2C0%2C24%2C22.53h0v-7.8a1.65%2C1.65%2C0%2C0%2C0-.47-1.15l-4-4.08A1.65%2C1.65%2C0%2C0%2C0%2C18.36%2C9H12.47A2.47%2C2.47%2C0%2C0%2C0%2C10%2C11.47Zm8.46-1%2C4.12%2C4.15a.25.25%2C0%2C0%2C1-.18.43H19a1%2C1%2C0%2C0%2C1-1-1h0l0-3.39a.25.25%2C0%2C0%2C1%2C.43-.17Z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E')
			}
			.im-replied--content{
				-ms-flex:1 1 auto;
				flex:1 1 auto;
				overflow:hidden
			}
			.im-replied--author{
				text-overflow:ellipsis;
				overflow:hidden;
				padding:1px 0 0
			}
			.im-replied--author a{
				font:700 12.5px/15px -apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif;
				-webkit-font-smoothing:antialiased;
				-moz-osx-font-smoothing:grayscale;
				color:#42648b
			}
			.im-replied--author:hover a{
				text-decoration:none
			}
			.im-replied--text{
				overflow:hidden;
				text-overflow:ellipsis;
				font:13px/18px -apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif;
				color:#000
			}
			.im-page-pinned--media{
				color:#4a6f97
			}
			/* END Replied */


			/* Start spoiler */
			.spoiler {
				/*border: 1px solid #e0e0e0;*/
				padding: 1em 0 0 1em;
			}
			.spoiler summary {
				color: #4d5895;
			}
			.spoiler details[open] div {
				animation: spoiler-open 1s;
			}
			.spoiler details div {
				animation: spoiler-close 1s;
			}
			@keyframes spoiler-close {
				0%   {max-height: 10em;}
				100% {max-height: 0;}
			}
			details {
				overflow: hidden;
				display: block;
				background: #dae1e8;
				border: 1px solid silver;
				border-radius: 4px;
				padding: .5em;
			}
			details summary {
				display: list-item;
				margin: -.5em;
				padding: .5em;
			}
			details[open] > summary {
				margin-bottom: .5em;
				border-bottom: 1px solid silver;
			}
			/* END spoiler */

			body{
				background:#edeef0;
				color:#000;
				margin:0;
				padding:0;
				direction:ltr;
				font-size:13px;
				font-family:-apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif;
				line-height:1.154;
				font-weight:400;
				-webkit-font-smoothing:subpixel-antialiased;
				-moz-osx-font-smoothing:auto
			}
			:focus{
				outline:none
			}
			::-moz-focus-inner{
				border:0
			}
			a{
				color:#2a5885;
				text-decoration:none;
				cursor:pointer
			}
			a b, b a{
				color:#42648b
			}
			a:hover{
				text-decoration:underline
			}
			b, strong{
				-webkit-font-smoothing:antialiased;
				-moz-osx-font-smoothing:grayscale
			}





			* html .clear_fix{
				height:1%
			}
			.clear_fix:after{
				content:'.';
				display:block;
				height:0;
				font-size:0;
				line-height:0;
				clear:both;
				visibility:hidden
			}
			.clear_fix{
				display:block
			}


			/*  #1  */
			.wrap .header{
				background:#4a76a8;
				height:42px;
				box-sizing:border-box;
				border-bottom:1px solid #4872a3;
				padding-top:11px
			}
			.wrap .header .page_header{
				margin:0 auto;
				width:640px
			}
			.wrap .header .page_header .top_home_logo{
				background:url(https://vk.com/images/svg_icons/ic_head_logo.svg) no-repeat 50%/contain;
				height:19px;
				width:34px;
				margin-left:8px;
				float:left
			}
			.wrap .header .page_header .index-link{
				float:right;
				margin-right:8px;
				margin-top:2px;
				color:#fff
			}


			/*  #2  */
			.wrap .page_content{
				margin:40px auto;
				width:640px
			}
			.wrap .page_content .page_block_h2 .ui_crumb_sep{
				background:url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='13' viewBox='71 29 6 13'%3E%3Cpath d='M71.4 40.6c-.3.3-.2.8.2 1 .3.3.8.2 1-.2l4-5.5c.2-.2.2-.6 0-.8l-4-5.5c-.2-.4-.7-.5-1-.2-.4.2-.5.7-.2 1l3.7 5.1-3.7 5.1z' fill='%23828a99' opacity='.7'/%3E%3C/svg%3E") 50% no-repeat
			}


			/*  #3  */
			.page_block{
				position:relative;
				background:#fff;
				border-radius:2px;
				box-shadow:0 1px 0 0 #d7d8db, 0 0 0 1px #e3e4e8;
				margin:15px 0 0
			}
			h2.page_block_h2{
				margin:0;
				font-size:inherit;
				font-weight:inherit;
				color:inherit
			}



			/*  ASD  */
			.page_block_header{
				display:block;
				background:#fafbfc;
				padding:0 20px;
				height:54px;
				line-height:54px;
				border-bottom:1px solid #e7e8ec;
				border-radius:2px 2px 0 0;
				font-size:16px;
				outline:none;
				color:#000
			}
			.page_block_header:hover{
				text-decoration:none
			}

			.page_block_header_extra{
				float:right
			}
			.page_block_header_extra_left{
				float:left
			}


			.page_block_header_inner{
				overflow:hidden;
				text-overflow:ellipsis;
				white-space:nowrap
			}



			/*  ASD  */
			.ui_crumb{
				display:inline;
				white-space:nowrap;
				overflow:hidden;
				text-overflow:ellipsis;
				line-height:54px;
				height:54px
			}
			a.ui_crumb{
				color:#656565
			}
			.ui_crumb_sep{
				display:inline;
				padding-left:6px;
				font-size:9px;
				margin:23px 10px 21px 12px;
				position:relative;
				top:-2px;
				background:url(https://vk.com/images/icons/breadcrumbs.png) -6px 0 no-repeat
			}
			@media (-webkit-min-device-pixel-ratio:2), (min-resolution:192dpi){
				.ui_crumb_sep{
					background-image:url(https://vk.com/images/icons/breadcrumbs_2x.png);
					background-size:12px 11px
				}
			}



			/*  ASD  */
			.wrap .wrap_page_content{
				font-size:14px;
				padding:10px 20px
			}
			.wrap .wrap_page_content .message .message__header{
				margin-bottom:12px;
				color:#939393
			}
			.wrap .wrap_page_content .message .message-edited{
				color:#939393
			}
			.wrap .wrap_page_content .attachment .attachment__description{
				display:inline-block;
				color:#939393;
				margin-right:6px
			}
			.wrap .wrap_page_content .attachment .attachment__link{
				display:inline-block
			}
			.wrap .wrap_page_content .pagination{
				margin-top:8px
			}
			.wrap .kludges{
				margin-top:8px
			}


			.wrap .item{
				padding:10px 0;
				word-wrap:break-word;
				border-bottom:1px solid #e7e8ec
			}
			.wrap .item.fwd{
				background: #dae1e8;
				padding-left: 20px;
			}
			.wrap .item:last-child{
				border-bottom:0
			}
			.wrap .item .item__main{
				color:#000
			}
			.wrap .item .item__main:not(:last-child){
				margin-bottom:8px
			}



			/*  ASD  */

			.fl_l{
				float:left
			}
			.fl_r{
				float:right
			}

			.pg_lnk{
				padding-bottom:2px
			}
			.pg_lnk:hover{
				padding-bottom:0;
				border-bottom:2px solid #dae1e8;
				text-decoration:none
			}

			h4 .fl_r,
			h4 span{
				font-weight:400
			}
			.subheader,
			h4 .fl_r,
			h4 span,
			h4.subheader{
				-webkit-font-smoothing:subpixel-antialiased;
				-moz-osx-font-smoothing:auto
			}

			.pg_lnk_sel{
				font-weight:700;
				-webkit-font-smoothing:antialiased;
				-moz-osx-font-smoothing:grayscale;
				color:#45688e
			}
			.pg_lnk_sel:hover{
				text-decoration:none
			}
			.pg_lnk_sel .pg_in{
				border-bottom:2px solid #6587ac;
				color:#2b2f33
			}
			.pg_in{
				padding:3px 5px 7px;
				color:#939393;
				font-size:12.5px
			}
		</style>
	</head>
	<body>

		<div class="wrap">

			<div class="header">
				<div class="page_header">
					<div class="top_home_logo"></div>
				</div>
			</div>

			<div class="page_content page_block">

				<h2 class="page_block_h2">
					<div class="page_block_header clear_fix">
						<div class="page_block_header_extra_left _header_extra_left"></div>
						<div class="page_block_header_extra _header_extra"></div>
						<div class="page_block_header_inner _header_inner">
							<a class="ui_crumb" href="./">Messages</a>
							<div class="ui_crumb_sep"></div>
							<div class="ui_crumb" >{DialogName}</div>
						</div>
					</div>
				</h2>

				<div class="wrap_page_content">
`,

templateReplyMessage = `
	<div class="im-mess--text" title="[{RPLY:RepliedMessageID}]">

		<div class="im-replied" onclick="document.getElementById('mid{RPLY:RepliedMessageID}').scrollIntoView();">
			<div class="im-replied--photo-wrapper">{RPLY:PHOTO_OR_NO}</div>

			<div class="im-replied--content">
				<div class="im-replied--author">
					{RPLY:MessageUser}
				</div>

				<div class="im-replied--text">
					{RPLY:Content}
				</div>
			</div>
		</div>

		{RPLY:Message}
	</div>
`;

templateDialogItem = `
		<div class="item{ClassItem}">
			<div class='item__main'>
				<div class="message" title="[{MessageID}]" id="mid{MessageID}">
					<div class="message__header">{MessageUser}{MessageEdited}, {MessageDate} [{MessageID}]</div>
					<div>
						{MessageContent}
						<div class="kludges"></div>
					</div>
				</div>
			</div>
		</div>
`,
templateDialogItemAttachment = `
	<div class="attachment" title="{ATT:Title}">
		<div class="attachment__description">{ATT:Type}</div>
		{ATT:Content}
	</div>
`,

templatePagen = `
		<div class="pagination clear_fix">
			<div class="fl_r">
				{PAGENS}
			</div>
		</div>
`,
templatePagenA = `
	<a class="pg_lnk{_SEL} fl_l" href="messages{FID}.html"><div class="pg_in">{FID}</div></a>
`,

templateSpoilerDIV = `
	<div class="spoiler">
		{SPOILER_DIV_CONTENT}
	</div>
`,
templateSpoiler = `
	<details {SPOILER_OPEN}>
		<summary>{SPOILER_TITLE}</summary>
		<div>{SPOILER_CONTENT}</div>
	</details>
`;
module.exports = vkLog;
