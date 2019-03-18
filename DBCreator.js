var mysql = require('mysql');
var co = require('co');
module.exports = co(function* (sd,dd,sh,dh,sun,dun,spass,dpass,stb) {

  var con = mysql.createConnection({
  host: dh,
  user: dun,
  password: dpass
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("CREATE DATABASE IF NOT EXISTS "+dd, function (err, result) {
    if (err) throw err;
    console.log("Database "+dd +" acquired");
    var msg =  require('./JSON.js')(sd,dd,sh,dh,sun,dun,spass,dpass,stb);
  });
});

})


