const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (request, response) =>  response.sendFile(`C:/Users/Anmol/Desktop/database mirroring/MainUI.html`));

app.post('/api/data', (request, response) => {
  const postBody = request.body;
  var sd = postBody.srcdb;
  var dd = postBody.destdb;
  var sh = postBody.srchost;
  var dh = postBody.desthost;
  var sun = postBody.srcun;
  var dun = postBody.destun;
  var spass = postBody.srcpass;
  var dpass = postBody.destpass;
  var stb = postBody.srctb;
  var msg = require('./DBCreator.js')(sd,dd,sh,dh,sun,dun,spass,dpass,stb);
  if (stb!="") {response.end("Only table " +stb+" copy is made, successfully made a backup of your database " +sd+" in a new database "+dd+" ! ");}
  else{response.end("Complete database is copied, successfully made a backup of your database " +sd+" in a new database "+dd+" ! ");}
});

app.listen(3000, () => console.info('Application running on port 3000'));