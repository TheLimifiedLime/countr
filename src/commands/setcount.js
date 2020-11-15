module.exports = {
  description: "Set the count.",
  usage: {
    "<count>": "The new count."
  },
  examples: {},
  aliases: [ "set", "=", "=count" ],
  permissionRequired: 1, // 0 All, 1 Mods, 2 Admins, 3 Server Owner, 4 Bot Admin, 5 Bot Owner
  checkArgs: (args) => args.length == 1,
  allowInCountingChannel: true
};

module.exports.run = async (message, [ count ], gdb) => {
  count = parseInt(count);
  if (!count) return message.channel.send("❌ Invalud number.");

  gdb.set("count", count);
  
  return message.channel.send(`✅ The count is now set to ${count}.`);
};