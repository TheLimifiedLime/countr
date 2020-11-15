module.exports = {
  description: "Get a list of your notifications in the server.",
  usage: {},
  examples: {},
  aliases: [ "notiflist", "notifs", "alerts", "listalerts", "listnotifs", "listnotifications" ],
  permissionRequired: 0, // 0 All, 1 Mods, 2 Admins, 3 Server Owner, 4 Bot Admin, 5 Bot Owner
  checkArgs: (args) => !args.length
};

const { flow } = require("../constants/index.js");

module.exports.run = async (message, _, gdb) => {
  let { notifications: rawList } = gdb.get(), notifications = {};
  for (const id in rawList) if (rawList[id].user == message.author.id) notifications[id] = rawList[id];

  if (!Object.keys(notifications).length) return message.channel.send("❌ You don't have any notifications for this server.");
  else return message.channel.send(`📋 Notifications for user ${message.author}:\n${formatNotifications(notifications).join("\n")}`);
};

function formatNotifications(notifications) {
  const all = [];
  for (const id in notifications) {
    const notif = notifications[id];
    let explanation;

    if (notif.mode == "each") explanation = flow.triggers.each.explanation.replace("{0}", notif.count);
    else if (notif.mode == "only") explanation = flow.triggers.only.explanation.replace("{0}", notif.count);

    all.push(`• \`${id}\` ${explanation}`);
  }
  return all;
}