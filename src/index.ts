import { Telegraf } from "telegraf"
import { findAll } from "./findTrains"
import fs from "node:fs"

import ids from "./ids.json"
import { checkCommand, configCommand, helpCommand, startCommand, whoisthisCommand } from "./commands"

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
  },
  {
    command: "unsubscribe",
    description: "Отписаться от рассылки"
  }
])

bot.start(startCommand)
bot.help(helpCommand)
bot.command("whoisthis", whoisthisCommand)
bot.command("check", checkCommand)
bot.command("config", configCommand)
bot.command("unsubscribe", ctx => {
  if (!initIds.includes(ctx.from.id)) {
    ctx.reply("Вы не подписаны на рассылку")
    return
  }
  initIds.splice(initIds.find(id => id !== ctx.from.id)!)
  fs.writeFileSync("./src/ids.json", JSON.stringify(initIds))
  ctx.reply("Вы успешно отписались от рассылки")
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

  const s = await findAll()
  if (s) {
    ids.forEach(id => bot.telegram.sendMessage(id, s, { parse_mode: "Markdown" }))
  }

  setTimeout(monitoring, 10 * 60 * 1000 + (Math.random() - 0.5) * 100000)
}

setTimeout(monitoring, 20000)

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
