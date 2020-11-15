const config = require("../../config.json"), mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = (client) => ({
  guild: require("./guild.js")(client), // guild(guildid)
  global: require("./global.js")
});