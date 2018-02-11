// Подкючаем API для работы с Telegram
const TelegramBot = require('node-telegram-bot-api')

// Устанавливаем токен, который выдавал нам бот.
const token = process.env.TOKEN || require('./token.js')

// Включить опрос сервера
const bot = new TelegramBot(token, { polling: true })

let query = {}
const lastIndex = 4

// Ассинхронная функция, ожидаем пока получим данные (переменная data) для вопросов
require('./src/getInfoForButton.js')(function(data) {
	// Запускает процесс, при вводе пользователя команды /start
	bot.onText(/\/start/, function(msg, match) {
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

		// По умолчанию индекс вопроса 0
		// Сбрасываем значения от предыдущих владельцев
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

		chat = msg.hasOwnProperty('chat') ? msg.from.id : msg.from.id

		// Отправляем сообщение в чат
		bot.sendMessage(chat, text, options)
	}

	function getOlympiadsInfo(url, msg) {
		require('./src/getInfoAboutOlimpiades.js')(url, function(data) {
			// console.log('asd', data)
		})
	}

	function searchResult(msg) {
		const userData = query[`user-${msg.from.id}`]
		const { subject, period, type, classNumber, dist } = userData
		const queryTitile = Object.keys(userData).map(function(key, index) {
			return userData[key].title
		})
		// console.log('Result: ', queryTitile.join(', '))
		const url = `${dist.value ? `dist=${dist.value}&` : ''}type=${type.value}&${
			subject.value
		}=on&class=${classNumber.value}&period_date=&period=${period.value}`

		chat = msg.hasOwnProperty('chat') ? msg.from.id : msg.from.id
		bot.sendMessage(chat, `Вы выбрали: ${queryTitile.join(', ')}. Результаты: `)

		getOlympiadsInfo(url, msg)

		// Чистим данные пользовательской сессии
		clearUserData(msg)
	}

	// Сборщик мусора, удаляем данные пользователя, когда выполнено целевое действие
	function clearUserData(msg) {
		delete query[`user-${msg.from.id}`]
	}

	// Функция проверки данных для пользователя
	function checkUserData(msg) {
		return (query[`user-${msg.from.id}`] =
			query[`user-${msg.from.id}`] === undefined ? {} : query[`user-${msg.from.id}`])
	}

	bot.on('callback_query', function(msg) {
		const answer = msg.data.split('_')
		const index = answer[0]
		const button = answer[1]
		const value = answer[2]
		const param = answer[3]
		// Данные из примера, пока оставить
		// if (questions[index].right_answer == button) {
		// 	bot.sendMessage(msg.from.id, 'Ответ верный ✅')
		// } else {
		// 	bot.sendMessage(msg.from.id, 'Ответ неверный ❌')
		// }

		// Выводит попап с выбранным значением
		// bot.answerCallbackQuery(msg.id, 'Вы выбрали: ' + value, true)

		const queryUser = checkUserData(msg)

		if (index === 'action') {
			switch (button) {
				case 'search':
					return searchResult(msg)
				case 'repeat':
					clearUserData(msg)
					return newQuestion(msg, 0)
				default:
			}
		} else if (index == lastIndex) {
			queryUser[param] = {
				title: value,
				value: button,
			}
			// console.log(query)
			searchResult(msg)
		}

		// Добавляю новое значение в запрос пользователя
		queryUser[param] = {
			title: value,
			value: button,
		}
		// console.log(query)
		// Вызываю функцию, которая выводит новый вопрос
		newQuestion(msg, parseInt(index) + 1)
	})
})
