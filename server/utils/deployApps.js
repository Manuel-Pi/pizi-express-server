
// Get config file
var config = require('./.,/config.json');
var replace = require("./replace");
console.log(">>>>>>>>>" + process.env.PORT);
replace({
  regex: "ENV_PORT",
  replacement: process.env.PORT || config.port,
  paths: ['./ROOT/'],
  recursive: true,
  silent: false,
});
replace({
    regex: "ENV_URL",
    replacement: "https://moins-de-neuf.herokuapp.com",
    paths: ['./ROOT/'],
    recursive: true,
    silent: false,
});