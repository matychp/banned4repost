require('dotenv').config()
const { db } = require('./lib/firebase')
const { Telegraf } = require('telegraf')

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const bot = new Telegraf(TELEGRAM_BOT_TOKEN)

bot.command('book', async (ctx) => {
  const {
    chat: { id = null },
    message: { entities = [], text = '' },
  } = ctx

  if (entities.length == 2 && entities[1].type == 'mention') {
    const { offset = 0, length = 0 } = entities[1]
    const bookedUsername = text.substr(offset, length)

    const bookRef = db.collection('books').doc(`${id}`)
    const doc = await bookRef.get()

    let books = 0
    if (!doc.exists) {
      books = 1

      const data = {
        users: {
          [bookedUsername]: books,
        },
      }

      bookRef.set(data)
    } else {
      const data = doc.data()

      const { users } = data
      books = users[bookedUsername]

      if (!books) {
        books = 1
        users[bookedUsername] = books
      } else {
        books++
        users[bookedUsername] = books
      }

      bookRef.set({
        users,
      })
    }

    ctx.reply(`${bookedUsername} has now ${books} books.`)
  } else {
    ctx.reply("You didn't specified a user.")
  }
})

bot.command('getBooks', async (ctx) => {
  const {
    chat: { id = null },
  } = ctx

  const bookRef = db.collection('books').doc(`${id}`)
  const doc = await bookRef.get()

  if (!doc.exists) {
    ctx.reply(`You have to book someone first`)
  } else {
    const data = doc.data()
    const { users } = data

    let message = 'Books:\n\n'
    for (const key in users) {
      message += `${key}: ${users[key]}\n`
    }

    ctx.reply(message)
  }
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// Start WebHook
const PORT = process.env.PORT || 3000
const URL = process.env.URL || ''
const WebhookURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebHook?url=${URL}`

bot.launch({
  webhook: {
    domain: WebhookURL,
    port: PORT,
  },
})
