require('dotenv').config()

const { db } = require('./lib/firebase')

const { Telegraf } = require('telegraf')
const PORT = process.env.PORT || 3000
console.log({ PORT })
const URL = process.env.URL || ''
console.log({ URL })

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
bot.telegram.setWebhook(`${URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`)
bot.startWebhook(`/bot${API_TOKEN}`, null, PORT)

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

    if (!doc.exists) {
      const data = {
        users: {
          [bookedUsername]: 1,
        },
      }

      bookRef.set(data)
    } else {
      const data = doc.data()

      const { users } = data
      const books = users[bookedUsername]

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

bot.launch()
