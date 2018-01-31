var TelegramBot = require('node-telegram-bot-api')
// require('require.async')(require)
// Устанавливаем токен, который выдавал нам бот.
var token = '253411366:AAF_Ays092pMByxbQUSINjE79ti_LuSkEuc'

// usage
require('./grabber.js')(function(data) {
	// const { data } = require('./grabber.js')

	// Включить опрос сервера
	var bot = new TelegramBot(token, { polling: true })

	function getRandomQuestion() {
		return data[0]
	}

	function newQuestion(msg) {
		// console.log(msg)
		// var arr = msg
		var arr = getRandomQuestion()
		var text = arr.title
		var options = {
			reply_markup: JSON.stringify({
				inline_keyboard: arr.buttons,
				parse_mode: 'Markdown',
			}),
		}
		chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id
		console.log(msg)
		bot.sendMessage(chat, text, options)
	}

	bot.onText(/\/start/, function(msg, match) {
		console.log(data)
		newQuestion(msg)
	})

	bot.on('callback_query', function(msg) {
		var answer = msg.data.split('_')
		var index = answer[0]
		var button = answer[1]

		if (questions[index].right_answer == button) {
			bot.sendMessage(msg.from.id, 'Ответ верный ✅')
		} else {
			bot.sendMessage(msg.from.id, 'Ответ неверный ❌')
		}

		bot.answerCallbackQuery(msg.id, 'Вы выбрали: ' + msg.data, true)
		newQuestion(msg)
	})
})
