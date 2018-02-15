// Пакет для парсинга сайтов
const osmosis = require('osmosis')

module.exports = function(url, callback) {
	function generateData(data) {
		// console.log(
		// 	data.classes.length,
		// 	data.title.length,
		// 	data.link.length,
		// 	// data.additionalInfo.length,
		// 	data.description.length,
		// 	data.rating.length
		// )
		return data.title.map(function(elem, index) {
			return {
				classes: data.classes[index],
				title: data.title[index],
				link: `http://www.olimpiada.ru${data.link[index]}`,
				// additionalInfo: data.additionalInfo[index],
				description: data.description[index],
				rating: data.rating[index],
			}
		})
	}

	// console.log(`http://www.olimpiada.ru/activities?${url}`)
	// Парсим данные с сайта по ссылке ниже
	// http://www.olimpiada.ru/include/activity/megalist.php
	osmosis
		.get(`http://www.olimpiada.ru/activities?${url}`)
		.set({
			classes: ['.fav_olimp .classes_dop'],
			title: ['.fav_olimp a.none_a:first-child .headline'],
			link: ['.fav_olimp a.none_a:first-child@href'],
			// additionalInfo: ['.fav_olimp a .headline.red'],
			description: ['.fav_olimp .olimp_desc'],
			rating: ['.fav_olimp .pl_rating'],
			commonCount: ['.content #megatitle'],
		})
		.data(function(listing) {
			// Когда данные собрали, передаем их обратно в index.js
			callback(generateData({ ...listing }), listing.commonCount)
		})
		// .log(console.log)
		.error(console.log)
	// .debug(console.log)
}
