// Подкючаем API для работы с Telegram
const TelegramBot = require('node-telegram-bot-api')

// Устанавливаем токен, который выдавал нам бот.
const token = process.env.TOKEN || require('./token.js')

// Включить опрос сервера
const bot = new TelegramBot(token, { polling: true })

let query = []
const lastIndex = 4

// Ассинхронная функция, ожидаем пока получим данные (переменная data) для вопросов
require('./grabber.js')(function(data) {
	// Запускает процесс, при вводе пользователя команды /start
	bot.onText(/\/start/, function(msg, match) {
		// По умолчанию индекс вопроса 0

		// Переменная msg содержит инфомацию о получателе и отправителе приходит с сервера, пример:
		// const msg = {
		// 	message_id: 308,
		// 	from: {
		// 		id: 144755140,
		// 		is_bot: false,
		// 		first_name: 'Alexander',
		// 		last_name: 'Shtykov',
		// 		username: 'shtbik',
		// 		language_code: 'ru-RU',
		// 	},
		// 	chat: {
		// 		id: 144755140,
		// 		first_name: 'Alexander',
		// 		last_name: 'Shtykov',
		// 		username: 'shtbik',
		// 		type: 'private',
		// 	},
		// 	date: 1517752501,
		// 	text: '/start',
		// 	entities: [{ offset: 0, length: 6, type: 'bot_command' }],
		// }

		// Сбрасываем значения от предыдущих владельцев
		query = []
		newQuestion(msg, 0)
	})

	function getQuestion(indexQuestion) {
		// Данные (data) берем из файла ./gabber.js
		return data[indexQuestion]
	}

	// Функция вывода вопроса в чат с отрпавителем
	function newQuestion(msg, indexQuestion) {
		// Получаем нужный вопрос по индексу
		const question = getQuestion(indexQuestion)

		// Получаем заголовок вопроса
		const text = question.title

		// составляем архитектуру вывода кнопок для ответа
		const options = {
			reply_markup: JSON.stringify({
				inline_keyboard: question.buttons,
				parse_mode: 'Markdown',
			}),
		}

		chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id

		// Отправляем сообщение в чат
		bot.sendMessage(chat, text, options)
	}

	function searchResult(msg) {
		console.log('Result: ', query.join())

		chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id
		bot.sendMessage(chat, `Запрос: ${query.join()}`)
	}

	bot.on('callback_query', function(msg) {
		// console.log(msg)
		const answer = msg.data.split('_')
		const index = answer[0]
		const button = answer[1]
		const value = answer[2]

		// Данные из примера, пока оставить
		// if (questions[index].right_answer == button) {
		// 	bot.sendMessage(msg.from.id, 'Ответ верный ✅')
		// } else {
		// 	bot.sendMessage(msg.from.id, 'Ответ неверный ❌')
		// }

		// Выводит попап с выбранным значением
		// bot.answerCallbackQuery(msg.id, 'Вы выбрали: ' + value, true)
		if (index === 'action') {
			switch (button) {
				case 'search':
					return searchResult(msg)
				case 'repeat':
					query = []
					return newQuestion(msg, 0)
				default:
			}
		} else if (index == lastIndex) {
			query.push(value)
			searchResult(msg)
		}

		query.push(value)
		// Вызываю функцию, которая выводит новый вопрос
		newQuestion(msg, parseInt(index) + 1)
	})
})
