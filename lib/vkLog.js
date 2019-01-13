const fs = require('fs'),
	path = require('path'),
	{ promisify } = require("util");;

const cachedir = "./data/";

class vkLog {
	
	static vkLog(userID, cacheFolder) {
		return new vkLog(userID, cacheFolder);
	}
	constructor(userID, cacheFolder="vk", customPath=false) {
		this.cDialogs = {};

		this.userID = userID;

		if(customPath) this.cPath = cachedir + cacheFolder+ "/" + customPath + "/";
		else this.cPath = cachedir + cacheFolder + "/" + userID + "/";

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
				let template = templateDialog.replace(/{UserNameDialog}/gi, dialogName);

				let errWrite = await writeFileAsync(cFile, template);
				if (errWrite) throw errWrite;
				console.log('vkLog Dialog file created: ['+nFile+']');

			}
		}

		return cFile;
	}

	async insertMessage(dialogID, dialogName, data, fileID=false) {
		fileID = fileID || _.genUX();

		let cFile = await this._initDalogFile(dialogID, dialogName, fileID);

		if(typeof data === "string")
			data = { text: data };

		data.peerID = data.peerID || 0;
		data.userID = data.userID || 0;
		data.color = data.color || "black";
		data.bgColor = data.bgColor || "black";
		data.date = (data.date && !isNaN(data.date))? _.dateF(data.date): data.date? data.date: "";

		let style = (data.color != "black")? 'style="background:'+ data.bgColor +'"': "";

		data.text = data.text.replace(/(?:\r\n|\r|\n)/g, '<br>');
		
		data.text = '<font color="'+data.color+'" '+style+'>'+data.text+'</font>';

		if(data.attachment) {
			if(Array.isArray(data.attachment)) {
				for(let att of data.attachment)
					data.text += templateDialogItemAttachment
						.replace(/{ATT:Type}/gi, att.type)
						.replace(/{ATT:Link}/gi, att.link)
						.replace(/{ATT:Text}/gi, att.text);
			}
			else
				data.text += templateDialogItemAttachment
					.replace(/{ATT:Type}/gi, data.attachment.type)
					.replace(/{ATT:Link}/gi, data.attachment.link)
					.replace(/{ATT:Text}/gi, data.attachment.text);
		}
		
		let okLink = data.peerID>0 && data.peerID<2e9 || data.userID>0 && data.userID<2e9;

		let MessageOOO = (data.outbox? "Вы": okLink? '<a href="{LinkPeerID}">{UserNameDialog}</a>': "<i>{UserNameDialog}</i>") 
			+ (data.edited? '<span class="message-edited" title=""> (ред.)</span>': "")

		let template = templateDialogItem
						.replace(/{ClassItem}/gi, (data.isFwd? " fwd":""))
						.replace(/{MessageOOO}/gi, MessageOOO)
						.replace(/{LinkPeerID}/gi, (data.peerID>0 && data.peerID<2e9? "https://vk.com/id"+data.peerID: "#"))
						.replace(/{LinkUserID}/gi, (data.userID>0 && data.userID<2e9? "https://vk.com/id"+data.userID: "#"))
						.replace(/{UserNameDialog}/gi, dialogName)
						.replace(/{MessageDate}/gi, data.date)
						.replace(/{MessageID}/gi, (data.id? "["+data.id+"]": ""))
						.replace(/{MessageText}/gi, data.text);

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


let templateDialog = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>VK</title>

		<style type="text/css">
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
							<a class="ui_crumb" href="#">Messages</a>
							<div class="ui_crumb_sep"></div>
							<div class="ui_crumb" >{UserNameDialog}</div>
						</div>
					</div>
				</h2>

				<div class="wrap_page_content">
`;
let templateDialogItem = `
		<div class="item{ClassItem}">
			<div class='item__main'>
				<div class="message" title="{MessageID}">
					<div class="message__header">{MessageOOO}, {MessageDate} {MessageID}</div>
					<div>{MessageText}<div class="kludges"></div></div>
				</div>
			</div>
		</div>
`;
let templateDialogItemAttachment = `
		<div class="attachment">
			<div class="attachment__description">{ATT:Type}</div>
			<a class='attachment__link' href='{ATT:Link}'>{ATT:Text}</a>
		</div>
`;
let templatePagen = `
		<div class="pagination clear_fix">
			<div class="fl_r">
				{PAGENS}
			</div>
		</div>
`;
let templatePagenA = `
	<a class="pg_lnk{_SEL} fl_l" href="messages{FID}.html"><div class="pg_in">{FID}</div></a>
`;
module.exports = vkLog;
