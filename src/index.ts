import { Telegraf } from "telegraf"
import { message } from "telegraf/filters"
import { findAll } from "./findTrains"
import { URLS } from "./url"
import fs from "node:fs"

import ids from "./ids.json"

const bot = new Telegraf(process.env.BOT_TOKEN!)

const initIds = ids as number[]

bot.telegram.setMyCommands([
  {
    command: "check",
    description: "Единоразово проверить все поезда из конфигурации (спроси у @makxca)"
  },
  {
    command: "subscribe",
    description: "Подписаться на рассылку. Проверки проводятся каждые 10 минут"
  },
  {
    command: "config",
    description: "Посмотреть конфигурацию"
  }
])

bot.start((ctx) => ctx.reply('Привет! Напиши /subscribe, чтобы подписаться на рассылку'))
bot.help((ctx) => ctx.reply('/check, /subscribe'))
bot.command("whoisthis", (ctx) => {
  ctx.reply(`This is ${ctx.botInfo.username}. And you are ${ctx.from.first_name} ${ctx.from.last_name}`)
})
bot.command("check", async (ctx) => {
  const s = await findAll(URLS)
  if (s) {
    ctx.reply(s, { parse_mode: "Markdown" })
  } else {
    ctx.reply("Ничего не нашёл :(")
  }
})
bot.command("config", ctx => {
  ctx.reply(`
Я смотрю на следующие ссылки:
${URLS.map(url => `- [${url.name}](${url.link})`).join("\n")}
`, { parse_mode: "Markdown" })
})
bot.command("subscribe", ctx => {
  if (initIds.includes(ctx.from.id)) {
    ctx.reply("Вы уже подписаны на рассылку")
    return
  }
  initIds.push(ctx.from.id)
  fs.writeFileSync("./src/ids.json", JSON.stringify(initIds))
  ctx.reply("Вы успешно подписались на рассылку")
})

bot.launch()
console.log("\n\nBot successfully started")

async function monitoring() {
  console.log("Monitoring", new Date().toLocaleTimeString("ru"))

  const s = await findAll(URLS)
  if (s) {
    ids.forEach(id => bot.telegram.sendMessage(id, s, { parse_mode: "Markdown" }))
  }

  setTimeout(monitoring, 10 * 60 * 1000 + (Math.random() - 0.5) * 100000)
}

setTimeout(monitoring, 20000)

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
