let vk;

var LongPollEvents = (_vk) => {
	vk = _vk;

	_.require("../plugins/sDumper")(vk, _);			// Дампит сообщения

	/*_.require("../plugins/PTSSaver")(vk, _);		// PTS восстановление
	_.require("../plugins/onlineLogger")(vk, _);	// Запись онлайна
	require("../plugins/catcherBadWord")(vk, _);	// Замена нецензурных слов
	require("../plugins/remeseg")(vk, _);			// Автоудаление смс
	// _.require("../plugins/oTyping")(vk, _);		// Кто набирает смс
	_.require("../plugins/swAvatar")(vk, _);		// Смена аватарки
	_.require("../plugins/VladerB")(vk, _); 		// Personal plugin
	// _.require("../plugins/alarmy")(vk, _);
	*/
};

module.exports = LongPollEvents;

