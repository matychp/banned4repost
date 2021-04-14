require('dotenv').config()

const { db } = require('./lib/firebase')

const { Telegraf } = require('telegraf')
const PORT = process.env.PORT || 3000
const URL = process.env.URL || ''

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

const bot = new Telegraf(TELEGRAM_BOT_TOKEN)
const webhookURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebHook?url=${URL}`
bot.telegram.setWebhook(webhookURL)
bot.startWebhook(`/bot${TELEGRAM_BOT_TOKEN}`, null, PORT)

bot.start((ctx) => {
  const {
    from: { first_name = '' },
  } = ctx

  ctx.reply(`Hello ${first_name}`)
})

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
        users[bookedUsername] = 1
      } else {
        users[bookedUsername]++
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

book.command('getBooks', async (ctx) => {
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

bot.launch()
