// Подкючаем API для работы с Telegram
const TelegramBot = require('node-telegram-bot-api')

const url = process.env.APP_URL || 'https://edu-telegrambot.herokuapp.com/'
// Устанавливаем токен, который выдавал нам бот.
const token = process.env.TOKEN || require('./token.js')

// Включить опрос сервера
const bot = new TelegramBot(
	token,
	process.env.TOKEN
		? {
				webHook: {
					// Port to which you should bind is assigned to $PORT variable
					// See: https://devcenter.heroku.com/articles/dynos#local-environment-variables
					port: process.env.PORT || 8000,
					// you do NOT need to set up certificates since Heroku provides
					// the SSL certs already (https://<app-name>.herokuapp.com)
					// Also no need to pass IP because on Heroku you need to bind to 0.0.0.0
				},
			}
		: {
				polling: true,
			}
)

bot.setWebHook(`${url}/bot${token}`)

bot.on('message', function onMessage(msg) {
	bot.sendMessage(msg.chat.id, 'I am alive on Heroku!')
})

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

	function getOlympiadsInfo(url, msg, cnow = undefined) {
		require('./src/getInfoAboutOlimpiades.js')(url, function(data, commonCount = ['']) {
			const countOlmp = commonCount[0].replace(/\D*\s+\S+/g, '') || 0
			console.log('cnow', cnow)
			chat = msg.hasOwnProperty('chat') ? msg.from.id : msg.from.id
			function additionalButton(loadmoreFlag) {
				const addButton = [{ text: '↪ Начать заново', callback_data: 'action_repeat' }]
				loadmoreFlag &&
					parseInt(countOlmp) > 20 &&
					cnow !== false &&
					addButton.unshift({
						text: '↙ Загрузить еще',
						callback_data: `action_l_${url}_${countOlmp}`,
					})

				const options = {
					reply_markup: JSON.stringify({
						inline_keyboard: [addButton],
						parse_mode: 'Markdown',
					}),
				}

				bot.sendMessage(chat, 'Выберите действие: ', options)
			}

			data.length && cnow !== false
				? data.forEach(function(olympiad, index) {
						bot
							.sendMessage(
								chat,
								`${olympiad.classes ? olympiad.classes : ''}\n<a href="${olympiad.link}">${
									olympiad.title
								}</a>\n${olympiad.description ? `<b>${olympiad.description}</b>` : ''}`,
								{
									parse_mode: 'html',
								}
							)
							.then(() => {
								if (index === data.length - 1) {
									additionalButton(true)
								}
							})
					})
				: (function() {
						bot.sendMessage(chat, 'К сожалению, по данному запросу мы не нашли олимпиад').then(() => {
							additionalButton(false)
						})
					})()
		})
	}

	function searchResult(msg) {
		const userData = query[`user-${msg.from.id}`]

		const { subject = {}, period = {}, type = {}, classNumber = {}, dist = {} } = userData
		const queryTitle = Object.keys(userData).map(function(key, index) {
			return userData[key].title
		})
		// console.log('Result: ', queryTitile.join(', '))
		const url = `${subject.value}=on${dist.value ? `&dist=${dist.value}&` : ''}${
			type.value ? `&type=${type.value}` : ''
		}${classNumber.value ? `&class=${classNumber.value}` : ''}${
			period.value ? `&period=${period.value}` : ''
		}`

		chat = msg.hasOwnProperty('chat') ? msg.from.id : msg.from.id
		// bot.sendMessage(chat, `Вы выбрали: ${queryTitle.join(', ')}. Результаты: `)

		console.log('URL1', url)
		getOlympiadsInfo(url, msg)

		// Чистим данные пользовательской сессии
		// clearUserData(msg)
	}

	// Сборщик мусора, удаляем данные пользователя, когда выполнено целевое действие
	function clearUserData(msg) {
		delete query[`user-${msg.from.id}`]
	}

	function getUrlVars(url) {
		let hash
		let myJson = {}
		const hashes = url.slice(url.indexOf('?') + 1).split('&')
		for (let i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=')
			myJson[hash[0]] = hash[1]
		}
		return myJson
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
				// case: 'loadmore' потому, что я превысил лимит в 64 байта
				case 'l':
					console.log('countOlmp', param)
					let urlParams = getUrlVars(value)

					let { cnow = 0 } = urlParams
					cnow = parseInt(cnow)
					// console.log(param - (cnow + 60), cnow <= param - 20)
					if (cnow) {
						if (cnow <= param - 20) {
							cnow = cnow + 20
						} else {
							cnow = false
						}
					} else {
						cnow = 20
					}

					let urlString = Object.entries({ ...urlParams, cnow: cnow })
						.map(e => e[0] + '=' + e[1])
						// .map(e => encodeURIComponent(e[0]) + '=' + encodeURIComponent(e[1]))
						.join('&')
					// console.log(param, cnow, { ...urlParams, cnow: cnow }, urlString)

					return getOlympiadsInfo(urlString, msg, cnow)
				// return false
				default:
			}
		} else if (index == lastIndex) {
			queryUser[param] = {
				title: value,
				value: button,
			}
			// console.log(query)
			return searchResult(msg)
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
