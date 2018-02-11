// Пакет для парсинга сайтов
const osmosis = require('osmosis')

// Классы и типы с сайта олимпиад спарсить не получилось
const classes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const types = ['Очно', 'Дистанционно']

const addButton = [
	{ text: '✔ Посмотреть результаты', callback_data: 'action_search' },
	{ text: '↪ Начать заново', callback_data: 'action_repeat' },
]

module.exports = function(callback) {
	// Функция для деления массива кнопок на столбцы
	function chunkArray(arr, chunk, addButtonFlag = true) {
		var i,
			j,
			tmp = []
		for (i = 0, j = arr.length; i < j; i += chunk) {
			tmp.push(arr.slice(i, i + chunk))
		}
		if (addButtonFlag) {
			return [...tmp, addButton]
		}
		return tmp
	}

	// Генерирую данные для вопросов в формат понятный telegram
	function generateData(data) {
		return [
			{
				title: 'Выберите предмет: 📒',
				buttons: chunkArray(
					data.subjects.map(function(subject, index) {
						return {
							text: subject,
							callback_data: '0_' + data.subjectsIndex[index] + '_' + subject + '_subject',
						}
					}),
					3,
					false
				),
			},
			{
				title: 'Выберите период: 📅',
				buttons: chunkArray(
					data.periods.filter(period => period !== 'В конкретный день').map(function(period, index) {
						const param = period === 'Сейчас' ? 'week' : 'year'
						return {
							text: period,
							callback_data: '1_' + param + '_' + period + '_period',
						}
					}),
					2
				),
			},
			{
				title: 'Выберите формат: 💬',
				buttons: chunkArray(
					data.formats.map(function(format, index) {
						return {
							text: format,
							callback_data: '2_' + data.formatsIndex[index] + '_' + format + '_type',
						}
					}),
					2
				),
			},
			{
				title: 'Выберите класс: ℹ',
				buttons: chunkArray(
					data.classes.map(function(classNumber, index) {
						return {
							text: classNumber,
							callback_data: '3_' + classNumber + '_' + classNumber + '_classNumber',
						}
					}),
					2
				),
			},
			{
				title: 'Выберите тип: 💡',
				buttons: chunkArray(
					data.types.map(function(type, index) {
						const param = type === 'Дистанционно' ? 'on' : ''
						return {
							text: type,
							callback_data: '4_' + param + '_' + type + '_dist',
						}
					}),
					2
				),
			},
		]
	}

	// Парсим данные с сайта по ссылке ниже
	osmosis
		.get('http://www.olimpiada.ru/activities')
		.set({
			subjects: ['#subject_filter .sc_sub font', '#subject_filter .sc_pop_sub font'],
			subjectsIndex: ['#subject_filter .sc_sub input@name', '#subject_filter .sc_pop_sub input@name'],
			periods: ['#top_period label'],
			formats: ['#activity_filter td:last-child label'],
			formatsIndex: ['#activity_filter td:last-child input@value'],
			// titles: ['.fav_olimp .headline'],
		})
		.data(function(listing) {
			// Когда данные собрали, передаем их обратно в index.js
			// По умолчанию я отрпавляю и массив классов и типов
			callback(generateData({ ...listing, classes, types }))
		})
}
