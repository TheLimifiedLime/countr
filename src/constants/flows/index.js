module.exports = Object.assign(
  {
    limitTriggers: 3,
    limitActions: 10,
    limitFlows: 20,
  },
  require("./flow.js"),
  require("./propertyTypes.js"),
  require("./walkthrough.js")
);
