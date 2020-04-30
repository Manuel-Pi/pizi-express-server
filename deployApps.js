var replace = require("replace");
console.log(">>>>>>>>>" + process.env.PORT);
replace({
  regex: "ENV_PORT",
  replacement: process.env.PORT,
  paths: ['./ROOT/'],
  recursive: true,
  silent: false,
});