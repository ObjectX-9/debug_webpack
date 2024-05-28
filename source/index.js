/* eslint-disable prettier/prettier */
const webpack = require('../lib/index.js');
const config = require('./webpack.config.js');

const complier = webpack(config);
complier.run((err, stats) => {
  if (err) {
		console.log("err===========>");
    console.error(err);
  } else {
		console.log("stats===========>");
    console.log(stats);
  }
})
