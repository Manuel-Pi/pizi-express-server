
// Get config file
var config = require('./config.json');
var replace = require("replace");
console.log(">>>>>>>>>" + process.env.PORT);
replace({
  regex: "ENV_PORT",
  replacement: process.env.PORT || config.port,
  paths: ['./ROOT/'],
  recursive: true,
  silent: false,
});