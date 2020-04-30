
// Get config file
var config = require('./config.json');
var replace = require("replace");
replace({
  regex: "ENV_PORT",
  replacement: config.port,
  paths: ['./ROOT/'],
  recursive: true,
  silent: false,
});
replace({
    regex: "ENV_URL",
    replacement: "https://0.0.0.0/",
    paths: ['./ROOT/'],
    recursive: true,
    silent: false,
});