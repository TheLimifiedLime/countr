const Discord = require("discord.js"),
  BLAPI = require("blapi"),
  config = require("../config.json"),
  commandHandler = require("./handlers/commands.js"),
  countingHandler = require("./handlers/counting.js"),
  prepareGuild = require("./handlers/prepareGuilds.js"),
  client = new Discord.Client({
    messageCacheLifetime: 30,
    messageSweepInterval: 60,
    disableMentions: "everyone",
    partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"],
    presence: {
      status: "idle",
      activity: {
        type: "WATCHING",
        name: "the loading screen",
      },
    },
    ws: {
      intents: ["GUILDS", "GUILD_MESSAGES"],
    },
  }),
  db = require("./database/index.js")(client);

const fastify = require("fastify")({ logger: false });

// Declare a route
fastify.get("/", (request, reply) => {
  reply.send(`What are you doing here?`);
});

// Run the server!
fastify.listen(3000, "0.0.0.0", (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`server listening on ${fastify.server.address().port}`);
});

let shard = "Shard N/A:",
  disabledGuilds = null;

client.once("shardReady", async (shardid, unavailable = new Set()) => {
  shard = `Shard ${shardid}:`;
  console.log(shard, `Ready as ${client.user.tag}!`);

  // process guilds
  disabledGuilds = new Set([
    ...Array.from(unavailable),
    ...client.guilds.cache.map((guild) => guild.id),
  ]);
  let startTimestamp = Date.now(),
    completed = 0,
    presenceInterval = setInterval(
      () =>
        client.user.setPresence({
          status: "idle",
          activity: {
            type: "WATCHING",
            name: `the loading screen (${Math.round(
              (completed / client.guilds.cache.size) * 100
            )}%)`,
          },
        }),
      1000
    );
  await Promise.all(
    client.guilds.cache.map(async (guild) => {
      await prepareGuild(guild, db);
      disabledGuilds.delete(guild.id);
      completed++;
    })
  );
  clearInterval(presenceInterval);
  console.log(
    shard,
    `All ${
      client.guilds.cache.size
    } available guilds have been processed and is now ready! [${
      Date.now() - startTimestamp
    }ms]`
  );
  disabledGuilds = false;

  // update presence
  updatePresence();
  client.setInterval(updatePresence, 60000);
});

async function updatePresence() {
  let name = `${config.prefix}help • ${(
      await db.global.getCount()
    ).toLocaleString("en-US")} counts this week!`,
    guild = client.guilds.cache.get(config.mainGuild);
  if (guild) {
    const gdb = await db.guild(guild.id),
      { channel, count } = gdb.get();
    name = `#${guild.channels.cache.get(channel).name} • ${count}`;
  }
  return client.user.setPresence({
    status: "online",
    activity: {
      type: "WATCHING",
      name,
    },
  });
}

client.on("message", async (message) => {
  if (
    !message.guild || // dms
    disabledGuilds == null ||
    (disabledGuilds && disabledGuilds.has(message.guild.id)) ||
    message.channel.name == "countr-flow-editor" || // ignore flow channels
    message.author.bot
  )
    return;

  const gdb = await db.guild(message.guild.id);
  let { channel, prefix } = gdb.get();
  if (!prefix.length) prefix = config.prefix;

  if (
    message.content.startsWith(prefix) ||
    message.content.match(`^<@!?${client.user.id}> `)
  )
    return commandHandler(message, gdb, db, channel, prefix);
  else if (channel == message.channel.id) return countingHandler(message, gdb);
  // TODO add args
  else if (message.content.match(`^<@!?${client.user.id}>`))
    return message.channel.send(
      `My prefix is \`${prefix}\`, for help type \`${prefix}help\`.`
    );
});

client
  .on("error", (err) => console.log(shard, "Client error.", err))
  .on("rateLimit", (rateLimitInfo) =>
    console.log(shard, "Rate limited.", rateLimitInfo)
  )
  .on("shardDisconnected", (closeEvent) =>
    console.log(shard, "Disconnected.", closeEvent)
  )
  .on("shardError", (err) => console.log(shard, "Error.", err))
  .on("shardReconnecting", () => console.log(shard, "Reconnecting."))
  .on("shardResume", (_, replayedEvents) =>
    console.log(shard, `Resumed. ${replayedEvents} replayed events.`)
  )
  .on("warn", (info) => console.log(shard, "Warning.", info))
  .login(process.env.TOKEN);

if (config.listKeys && Object.values(config.listKeys).length)
  BLAPI.handle(client, config.listKeys);
