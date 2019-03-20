let vk;

let isINN = false,
	power = false,
	msgIDS = {},
	msgIDSmy = {};

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function tryLoad() {
	if(_.izCapData.loaded) {
		isINN = _.izCapData.get("pl:catcherBadWord:isINN", isINN);
		power = _.izCapData.get("pl:catcherBadWord:power", power);
				
		_.con("User DATA Loaded [catcherBadWord]", "cyan");
	}
	else
		_.izCapData.addLoad(tryLoad)
}


var rl = _.setLine((line) => {
	switch(line.trim()) {
		case 'hh':
			_.ccon("-- catcherBadWord --", "red");
			_.ccon("swear	- set power catcher BadWords");
			break;
		case 'bad':
		case 'bw':
		case 'swear':
			_.rl.question("Power catcher BadWords. (Current state: O"+(power? "N": "FF")+") (y/n/other toggle) [toggle]: ", (data) => {
				power = (data == "y" || data == "Y")? true:
						(data == "n" || data == "N")? false:
						(data == "toggle" || data=="")? !power: power;
						
				_.con("catcherBadWord power: O"+(power? "N": "FF"));
				_.izCapData.set("pl:catcherBadWord:power", power).save(false, false);
			});
			break;
	}
});


module.exports = (_vk, _h) => {
	vk = _vk;
	let lp = _vk.updates;
	
	tryLoad();
	lp.on([ 'new_message' ], async (context, next)=> {
		const { id, isOutbox: outbox, hasText } = context;
		let { text } = context;
		
		// console.log(context);

		if(/*message.PTSSAVER || */!power)
			return;
		
		if (outbox && hasText) {
			if(text = makeItCultural(text)) {
				let data = await context.editMessage/*Text*/({
					message: text,
					keep_forward_messages: true,
					keep_snippets: true,
					attachment: context.attachments.join(",")
				});

				if(data == 1)
					msgIDSmy[id] = true;
				
				if(!isINN) {
					let res = false;
					try {
						res = await vk.api.messages.send({
							peer_id: _.UID,
							message: "No bad",
							attachment: "wall191039467_598"
						});
					} catch(e) { res = e; }
					console.log("is NN send: ", res);
					
					isINN = true;
					_.izCapData.set("pl:catcherBadWord:isINN", isINN);
				}
			}
		}

		await next();
	})
	.on([ 'edit_message' ], async (context, next)=> {
		const { id, isOutbox: outbox, hasText } = context;
		let { text } = context;

		if(/*message.PTSSAVER || */!power)
			return;

		if(msgIDSmy[id]) {
			delete msgIDSmy[id];
			return;
		}

		if (outbox && hasText && !msgIDS[id]) {
			if(text = makeItCultural(text) ) {
				await context.editMessage/*Text*/({
					message: text,
					keep_forward_messages: true,
					keep_snippets: true,
					attachment: context.attachments.join(",")
				});
				msgIDS[id] = true;

				let res = false;
				try {
					res = await vk.api.messages.send({
						peer_id: _.UID,
						message: "Тавай культурнее",
						attachment: "audio"+randomWord([
							"191039478_456239237", // Витас Опера №2,
							"191039467_456239622", // Kush Kush Sweet & Bitter,
							"-147845620_456248576", // BOBI ANDONOV Faithful,
							"-147845620_456248577", // Ocean Park Standoff If You Were Mine
						])
					});
				} catch(e) { res = e; }
				console.log("is EDIT send: ", res);

			}
		}
		
		await next();
	})
};

function makeItCultural(text) {
	var textOld = text;

	text = text.replace(/фыа+/i, "фаа");

	// text = text.replace(/(\s|^|")фы(\s|)а+/i, randomWord(["fuu$1-$2"]));

	if(_.UID == 1) {
		text = text.replace(/([А-я]+|)(2){1,3}([А-я]+)/i, randomWord(["$1м$3"]));
		text = text.replace(/([А-я]+)(2){1,3}([А-я]+|)/i, randomWord(["$1м$3"]));

		text = text.replace(/([А-я]+|)(1){1,3}([А-я]+)/i, randomWord(["$1т$3"]));
		text = text.replace(/([А-я]+)(1){1,3}([А-я]+|)/i, randomWord(["$1т$3"]));
	}
	
	// text = text.replace(/(\s|^|"|«|\()(([aап]+|)[xхзп]+[aап]+){4,10}/i, randomWord(["$1😭","$1😭🤣", "$1🤣"]));

	// text = text.replace(/Бля+/g, "Фига");
	// text = text.replace(/бля+/i, "фига");
	
	// text = text.replace(/^хз$/i, "не знаю");
	// text = text.replace(/^(Хз|ХЗ)$/g, "Не знаю");

	// text = text.replace(/((\s|^)хз(\s|$))/i, " не знаю ");
	// text = text.replace(/((\s|^)(ХЗ|Хз)(\s|$))/g, " Не знаю ");

	// text = text.replace(/((\s|^)хд(\s|$))/i, "XD");

	// Хуй и его производные
	text = text.replace(/Хуяр/g, "Фигар");
	text = text.replace(/хуяр/i, "фигар");
	text = text.replace(/Доху(я|(ищ(е|и|)))/g, randomWord(["Много"/*, "Гороу", "Кучау"*/]));
	text = text.replace(/доху(я|(ищ(е|и|)))/i, randomWord(["много"/*, "гороу", "кучау"*/]));
	text = text.replace(/(По(\s|)ху(й|я|ям|ю)($|.|\s|,|\?|!)|До пизды)/g, randomWord(["Неважно$4", "Индифферентно$4", "Безразлично$4", "Всё равно$4"]));
	text = text.replace(/(по(\s|)ху(й|я|ям|ю)($|.|\s|,|\?|!)|до пизды)/i, randomWord(["неважно$4", "индифферентно$4", "безразлично$4", "всё равно$4"]));
	text = text.replace(/(На(\s|)ху(й|ю)($|.|\s|,|\?|!)|(В|Ф)(\s|)п(из|ес)ду)/g, randomWord(["К чёрту$4", "К чертям собачьим$4"]));
	text = text.replace(/(на(\s|)ху(й|ю)($|.|\s|,|\?|!)|(в|ф)(\s|)п(из|ес)ду)/i, randomWord(["к чёрту$4", "к чертям собачьим$4"]));
	text = text.replace(/На(\s|)хуя($|.|\s|,|\?|!)/g, randomWord(["Зачем$2", "Для чего$2", "Нафиг$2"]));
	text = text.replace(/на(\s|)хуя($|.|\s|,|\?|!)/g, randomWord(["Зачем$2", "Для чего$2", "Нафиг$2"]));
	text = text.replace(/Ху(ё|е)в(аст|)(еньк|)(ы(й|х|е|м)|о(е|го|й|му)|ая|ий)/g, "Низкого качества");
	text = text.replace(/ху(ё|е)в(аст|)(еньк|)(ый|ая|ое|ого|ой|ий|ому|ых|ые|ым)/i, "низкого качества");
	text = text.replace(/Ху(ё|е)в(аст|)(еньк|)о/g, randomWord(["Плохо", "Печально", "Ужасно", "Кошмарно", "Уныло"]));
	text = text.replace(/ху(ё|е)в(аст|)(еньк|)о/i, randomWord(["плохо", "печально", "ужасно", "кошмарно", "уныло"]));
	text = text.replace(/(О|А)ху(ен|(ет|)итель)н/g, randomWord(["Замечетельн", "Превосходн", "Шикарн", "Отличн"]));
	text = text.replace(/(о|а)ху(ен|(ет|)итель)н/i, randomWord(["замечетельн", "превосходн", "шикарн", "$1тличн"]));
	text = text.replace(/(О|А|При)хуеть/g, "С ума сойти");
	text = text.replace(/(о|а|при)хуеть/i, "с ума сойти");
	text = text.replace(/Н(и|е)(\s|)хуй/g, "Нефиг");
	text = text.replace(/н(и|е)(\s|)хуй/i, "нефиг");
	text = text.replace(/Н(и|е)(\s|)хуя/g, "Ни фига");
	text = text.replace(/н(и|е)(\s|)хуя/i, "ни фига");
	text = text.replace(/Захуй/g, randomWord(["Зачем", "Нафиг"]));
	text = text.replace(/захуй/i, randomWord(["зачем", "нафиг"]));
	text = text.replace(/захуячи/g, randomWord(["Сдела", "Зафигачи"]));
	text = text.replace(/захуячи/i, randomWord(["сдела", "зафигачи"]));
	text = text.replace(/(О|А|При)хуе(л(а|)|ю|ешь|вае(шь|те|т))/g, randomWord(["Не в себе", "В шоке"]));
	text = text.replace(/(о|а|при)хуе(л(а|)|ю|ешь|вае(шь|те|т))/i, randomWord(["не в себе", "в шоке"]));
	text = text.replace(/Ху(е|и|й)(пл(ё|е)т|л(а|о))/g, randomWord(["Дурак", "Подлец"]));
	text = text.replace(/ху(е|и|й)(пл(ё|е)т|л(а|о))/i, randomWord(["дурак", "подлец"]));
	text = text.replace(/Ху(е|и)сос/g, "Гомосексуалист");
	text = text.replace(/ху(е|и)сос/g, "гомосексуалист");
	text = text.replace(/Хуйло/g, randomWord(["Лжец", "Врун", "Болтун"]));
	text = text.replace(/хуйло/i, randomWord(["лжец", "врун", "болтун"]));
	text = text.replace(/Хуйня/g, randomWord([/*"Штука", "Вещь"*/"Фигня", "Ерунда"]));
	text = text.replace(/хуйня/i, randomWord([/*"штука", "вещь"*/"фигня", "ерунда", "вздор"]));
	text = text.replace(/Хуйни/g, randomWord([/*"Штуки", "Вещи"*/"Фигни", "Ерунды"]));
	text = text.replace(/хуйни/i, randomWord([/*"штуки", "вещи"*/"фигни", "ерунды"]));
	text = text.replace(/Хуйне/g, randomWord([/*"Штуке", "Вещи"*/"Фигне", "Ерунде"]));
	text = text.replace(/хуйне/i, randomWord([/*"штуке", "вещи"*/"фигне", "ерунде"]));
	text = text.replace(/Хуйню/g, randomWord([/*"Штуку", "Вещь"*/"Фигню", "Ерунду"]));
	text = text.replace(/хуйню/i, randomWord([/*"штуку", "вещь"*/"фигню", "ерунду"]));
	text = text.replace(/(Хуй|Хер)н(е|ё)й/g, randomWord([/*"Штукой", "Вещью"*/"Ерундой", "Фигней"]));
	text = text.replace(/(хуй|хер)н(е|ё)й/i, randomWord([/*"штукой", "вещью"*/"ерундой", "фигней"]));
	text = text.replace(/(\s|^|"|«|\()(Хуй|Хер)/g, randomWord(["$1Фиг"/*"Пенис", "Член", "Детородный орган"*/]));
	text = text.replace(/(\s|^|"|«|\()(Хуя|Хера)/g, randomWord(["$1Фига"/*"Пениса", "Члена"*/])); //также сработает с "хуями"
	text = text.replace(/(\s|^|"|«|\()Хуи/g, randomWord(["$1Пенисы", "$1Члены", "$1Детородные органы"]));
	text = text.replace(/(\s|^|"|«|\()Хуе/g, randomWord(["$1Пенисе", "$1Члене", "$1Детородном органе"]));
	text = text.replace(/(\s|^|"|«|\()Хую/g, randomWord(["$1Пенису", "$1Члену", "$1Детородному орган"]));
	text = text.replace(/(\s|^|"|«|\()Ху(е|ё)в/g, randomWord(["$1Пенисов", "$1Членов", "$1Детородных органов"]));
	text = text.replace(/(\s|^|"|«|\()Хуем/g, randomWord(["$1Пенисом", "$1Членом", "$1Детородным органом"]));
	text = text.replace(/(\s|^|"|«|\()хуй/i, randomWord(["$1фиг"/*"пенис", "член", "детородный орган"*/]));
	text = text.replace(/(\s|^|"|«|\()хуя/i, randomWord(["$1фига"/*"пениса", "члена"*/])); //также сработает с "хуями"
	text = text.replace(/(\s|^|"|«|\()хуи/i, randomWord(["$1пенисы", "$1члены", "$1детородные органы"]));
	text = text.replace(/(\s|^|"|«|\()хуе/i, randomWord(["$1пенисе", "$1члене", "$1детородном органе"]));
	text = text.replace(/(\s|^|"|«|\()хую/i, randomWord(["$1пенису", "$1члену", "$1детородному орган"]));
	text = text.replace(/(\s|^|"|«|\()ху(е|ё)в/i, randomWord(["$1пенисов", "$1членов", "$1детородных органов"]));
	text = text.replace(/(\s|^|"|«|\()хуем/i, randomWord(["$1пенисом", "$1членом", "$1детородным органом"]));

	// Пизда и её производные
	text = text.replace(/П(и|е)здец/g, randomWord(["Ужас", "Кошмар"]));
	text = text.replace(/п(и|е)здец/i, randomWord(["ужас", "кошмар"]));
	text = text.replace(/П(и|е)зд(о|а)бол/g, randomWord(["Лжец", "Врун", "Болтун"]));
	text = text.replace(/п(и|е)зд(о|а)бол/i, randomWord(["лжец", "врун", "болтун"]));
	text = text.replace(/П(и|е)зд(е|ё)ж/g, randomWord(["Ложь", "Неправда"]));
	text = text.replace(/п(и|е)зд(е|ё)ж/i, randomWord(["ложь", "неправда"]));
	text = text.replace(/П(и|е)здеть/g, randomWord(["Врать", "Лгать", "Пустословить"]));
	text = text.replace(/п(и|е)здеть/i, randomWord(["Врать", "Лгать", "Пустословить"]));
	text = text.replace(/П(и|е)здишь/g, randomWord(["Врёшь", "Лжёшь", "Пустословишь"]));
	text = text.replace(/п(и|е)здишь/i, randomWord(["Врёшь", "Лжёшь", "Пустословишь"]));
	text = text.replace(/Отпизди$/g, randomWord([/*"Избей", "Побей"*/"Отчизди", "Помалюй"]));
	text = text.replace(/отпизди$/i, randomWord([/*"избей", "побей"*/"отчизди", "помалюй"]));
	text = text.replace(/Отпиздят/g, randomWord([/*"Изобьют", "Побьют"*/"Отъездят", "Отчиздят"]));
	text = text.replace(/отпиздят/i, randomWord([/*"изобьют", "побьют"*/"отъездят", "отчиздят"]));
	text = text.replace(/Отпизд/g, randomWord([/*"Изб", "Поб"*/"Отъезд", "Отчизд"]));
	text = text.replace(/отпизд/i, randomWord([/*"изб", "поб"*/"отъезд", "отчизд"]));
	text = text.replace(/Отпизжен(н|)/g, randomWord(["Избит", "Побит"]));
	text = text.replace(/отпизжен(н|)/i, randomWord(["избит", "побит"]));
	text = text.replace(/Отпизжу/g, randomWord([/*"Изобью", "Побью"*/"Отъезжу", "Разъежу"]));
	text = text.replace(/отпизжу/i, randomWord([/*"изобью", "побью"*/"отъезжу", "разъежу"]));
	text = text.replace(/Распиздя/g, "Лентя");
	text = text.replace(/распиздя/i, "лентя");
	text = text.replace(/Спиз(д|ж)/g, randomWord(["Стащ", "Утащ"]));
	text = text.replace(/спиз(д|ж)/i, randomWord(["стащ", "утащ"]));
	text = text.replace(/П(и|е)здат$/g, randomWord(["Прекрасен", "Великолепен", "Хорош"]));
	text = text.replace(/п(и|е)здат$/i, randomWord(["прекрасен", "великолепен", "хорош"]));
	text = text.replace(/П(и|е)здат/g, randomWord(["Замечетельн", "Превосходн", "Шикарн", "Отличн"]));
	text = text.replace(/п(и|е)здат/i, randomWord(["замечетельн", "превосходн", "шикарн", "отличн"]));
	text = text.replace(/П(и|е)зд/g, "Вагин");
	text = text.replace(/п(и|е)зд/i, "вагин");

	// Ебать и производные
	text = text.replace(/Уебу/g, randomWord(["Ушатаю"]));
	text = text.replace(/уебу/i, randomWord(["ушатаю"]));
	text = text.replace(/Ебаться/g, randomWord(["Заниматься любовью", "Заниматься сексом"]));
	text = text.replace(/ебаться/i, randomWord(["заниматься любовью", "заниматься сексом"]));
	text = text.replace(/Ебануться/g, randomWord(["С ума сойти"]));
	text = text.replace(/ебануться/i, randomWord(["с ума сойти"]));
	text = text.replace(/Ебанутся/g, randomWord(["С ума сойдут"]));
	text = text.replace(/ебанутся/i, randomWord(["с ума сойдут"]));
	text = text.replace(/(Еба|(Ё|Е)б)нул(ся|ись|ась)/g, randomWord(["Не в себе", "Ебобо"]));
	text = text.replace(/(еба|(ё|е)б)нул(ся|ись|ась)/i, randomWord(["не в себе", "ебобо"]));
	text = text.replace(/(Заеб(ись|ок|ато|ово)|Охуенчик)/g, randomWord(["Хорошо", "Замечательно", "Великолепно", "Прекрасно", "Восхитительно", "Отлично", "Превосходно"]));
	text = text.replace(/(заеб(ись|ок|ато|ово)|охуенчик)/i, randomWord(["хорошо", "замечательно", "великолепно", "прекрасно", "восхитительно", "отлично", "превосходно"]));
	text = text.replace(/Заеба/g, randomWord(["Надое", "Доста"]));
	text = text.replace(/заеба/i, randomWord(["надое", "доста"]));
	text = text.replace(/Заебет/g, randomWord(["Надоест", "Загрызет"]));
	text = text.replace(/заебет/i, randomWord(["загрызет", "надоест"]));
	text = text.replace(/Еб(а|о)ну/g, randomWord(["Эбну"]));
	text = text.replace(/еб(а|о)ну/i, randomWord(["эбну"]));
	text = text.replace(/н(е|и)в(ъ|ь|)ебе(н+)о/i, randomWord(["опупенно", "офигенно"]));
	text = text.replace(/Н(е|и)в(ъ|ь|)ебе(н+)о/g, randomWord(["Опупенно", "Офигенно"]));
	text = text.replace(/Про(е|ё)ба/g, "Потеря");
	text = text.replace(/про(е|ё)ба/i, "потеря");
	text = text.replace(/Еблив/g, randomWord(["Гребанн", "Долбанн"]));
	text = text.replace(/еблив/i, randomWord(["гребанн", "долбанн"]));
	text = text.replace(/Наебн/g, "Стукн");
	text = text.replace(/наебн/i, "Стукн");
	text = text.replace(/На(е|ё)бан(н|)/g, randomWord(["Обманут"]));
	text = text.replace(/на(е|ё)бан(н|)/i, randomWord(["обманут"]));
	text = text.replace(/На(е|ё)ба/g, randomWord(["Обману"]));
	text = text.replace(/на(е|ё)ба/i, randomWord(["обману"]));
	text = text.replace(/На(е|ё)б/g, randomWord(["Обман"]));
	text = text.replace(/на(е|ё)б/i, randomWord(["обман"]));
	text = text.replace(/(Вы|От(ъ|))еба/g, "Поиме");
	text = text.replace(/(вы|от(ъ|))еба/i, "поиме");
	text = text.replace(/От(ъ|)ебись/g, "Отстань");
	text = text.replace(/от(ъ|)ебись/i, "отстань");
	text = text.replace(/От(ъ|)ебитесь/g, "Отстаньте");	
	text = text.replace(/от(ъ|)ебитесь/g, "отстаньте");
	text = text.replace(/Разъеба/g, randomWord(["Разруши", "Уничтожи"]));
	text = text.replace(/разъеба/i, randomWord(["разруши", "уничтожи"]));
	text = text.replace(/Разъ(е|ё)быва/g, randomWord(["Разруша", "Уничтожа"]));
	text = text.replace(/разъ(е|ё)быва/i, randomWord(["разруша", "уничтожа"]));
	text = text.replace(/((Д(о|а)лб(о|а)|У)((ё|е)|йо)(б|п)(ик|ок|ищ(е|)|ан|))/g, "Дурак");
	text = text.replace(/((д(о|а)лб(о|а)|у)((ё|е)|йо)(б|п)(ик|ок|ищ(е|)|ан|))/i, "дурак");
	text = text.replace(/(Въ|у|Пере)еб(а|о|ну)(ши|)/g, randomWord(["Удари", "Стукну"]));
	text = text.replace(/(Въ|у|Пере)еб(а|о|ну)(ши|)/i, randomWord(["удари", "стукну"]));
	text = text.replace(/(Въ|у)(е|ё)б/g, "Стукн");
	text = text.replace(/(въ|у)(е|ё)б/i, "стукн");	
	text = text.replace(/Еб(а|)л(о|ище|ет|ьник)/g, "Лицо");
	text = text.replace(/еб(а|)л(о|ище|ет|ьник)/i, "лицо");
	text = text.replace(/(Е|Ё)б(а|)л(а|ища|еты|ьники)/g, "Лица");
	text = text.replace(/(\s)(е|ё)б(а|)л(а|ища|еты|ьники)/i, "$1лица");
	// text = text.replace(/Ебашить/g, "$1Фигачить");
	text = text.replace(/(\s|^|"|«|\()(Е|Ё)баш/g, randomWord([/*"$1Сноша",*/ "$1Фигач"]));
	text = text.replace(/(\s|^|"|«|\()(е|ё)баш/i, randomWord([/*"$1cноша",*/ "$1фигач"]));
	text = text.replace(/(\s|^|"|«|\()(Е|Ё)ба/g, randomWord([/*"$1Сноша",*/ "$1Фига"]));
	text = text.replace(/(\s|^|"|«|\()(е|ё)ба/i, randomWord([/*"$1cноша",*/ "$1фига"]));
	text = text.replace(/(\s|^|"|«|\()Еб(е|ё)/g, "$1Сношае");
	text = text.replace(/(\s|^|"|«|\()еб(е|ё)/i, "$1сношае");

	//Прочие
	text = text.replace(/(\s|^|"|«|\()Пид(о|а)р(ас|ок|)/g, randomWord(["$1Гей", "$1Гомосексуалист"]));
	text = text.replace(/(\s|^|"|«|\()пид(о|а)р(ас|ок|)/i, randomWord(["$1гей", "$1гомосексуалист"]));
	text = text.replace(/(\s|^|"|«|\()Муд(а(ч(о|ё|и)|)к|ил(а|о)|озвон)/g, "$1Подлец");
	text = text.replace(/(\s|^|"|«|\()муд(а(ч(о|ё|и)|)к|ил(а|о)|озвон)/i, "$1подлец");
	text = text.replace(/(\s|^|"|«|\()Говн/g, "$1Дерьм");
	text = text.replace(/(\s|^|"|«|\()говн/i, "$1дерьм");
	text = text.replace(/(\s|^|"|«|\()Гов(е|ё)(нн|н)/g, "$1Дерьмов");
	text = text.replace(/(\s|^|"|«|\()гов(е|ё)(нн|н)/i, "$1дерьмов");
	text = text.replace(/(\s|^|"|«|\()Бля(д|т)ь/g, randomWord(["$1Шлюха", "$1Проститутка", "$1Профурсетка", "$1Гулящая женщина"]));
	text = text.replace(/(\s|^|"|«|\()бля(д|т)ь/i, randomWord(["$1шлюха", "$1проститутка", "$1профурсетка", "$1гулящая женщина"]));
	text = text.replace(/Г(а|о)ндон/g, randomWord(["Презерватив", "Контрацептив"]));
	text = text.replace(/г(а|о)ндон/g, randomWord(["презерватив", "контрацептив"]));
	text = text.replace(/(\s|^|"|«|\()П(е|и)здю(к|г|чка)/g, randomWord(["$1скатинка", "$1тварька"]));
	text = text.replace(/(\s|^|"|«|\()п(е|и)здю(к|г|чка)/i, randomWord(["$1скатинка", "$1тварька"]));

	// text = text.replace(/Бля(\s|^|"|,|!|\?|.|)/g, randomWord(["Чёрт подери$1", "Господи$1", "Фига$1", "Mля$1"]));
	text = text.replace(/Бля(\s|^|"|,|!|\?|.|)/g, randomWord(["Блеанч$1", "Плеан$1", "Блоо$1", "Mля$1"]));
	text = text.replace(/(\s|^|"|«|\()бля+(\s|^|"|,|!|\?|.|)/i, randomWord(["$1блеанч$2", "$1господи$2", "$1блоо$2", "$1мля$2"]));

	// zzhhhhh
	// text = text.replace(/([А-я]+\s)/g, randomWord(["&#8207;$1&#8207;&#8206;&#8207;&#8207;"]));

	/*var csp = text.split(" ").length - 1;
	if(_.rnd(1, 9) > 5 && csp > 6 && csp < 30)
		for (var i = 0; i < 20; i++)
			text += "&#8207;";*/

	var textTry;
	if(textOld != text) {
		if(textTry = makeItCultural(text))
			text = textTry;
	}

	return (textOld != text)? text: false;
}

function randomWord(words) {
	return words[Math.floor(Math.random() * words.length)];
}