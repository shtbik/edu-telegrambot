const osmosis = require('osmosis')

module.exports = function(callback) {
	const classes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
	const types = ['Очно', 'Дистанционно']
	// let data = []
	function generateData(data) {
		return [
			{
				title: 'Выберите предмет',
				buttons: data.subjects.map(function(subject, index) {
					return [{ text: subject, callback_data: '0_' + index }]
				}),
			},
			{
				title: 'Выберите период',
				buttons: data.periods.map(function(period, index) {
					return [{ text: period, callback_data: '1_' + index }]
				}),
			},
			{
				title: 'Выберите формат',
				buttons: data.formats.map(function(format, index) {
					return [{ text: format, callback_data: '2_' + index }]
				}),
			},
			{
				title: 'Выберите класс',
				buttons: data.classes.map(function(classNumber, index) {
					return [{ text: classNumber, callback_data: '3_' + index }]
				}),
			},
			{
				title: 'Выберите тип',
				buttons: data.types.map(function(type, index) {
					return [{ text: type, callback_data: '4_' + index }]
				}),
			},
		]
	}

	osmosis
		.get('http://www.olimpiada.ru/activities')
		// .find('#subject_filter')
		.set({
			subjects: ['#subject_filter .sc_sub font', '#subject_filter .sc_pop_sub font'],
			periods: ['#top_period label'],
			formats: ['#activity_filter label'],

			titles: ['.fav_olimp .headline'],
		})
		.data(function(listing) {
			// console.log(generateData({ ...listing, classes, types }))
			// data = generateData({ ...listing, classes, types })
			callback(generateData({ ...listing, classes, types }))
			// console.log({ ...listing, classes, types })
		})
		.done(function() {
			// module.exports.data = data
		})
}
// module.exports.generateData = generateData
