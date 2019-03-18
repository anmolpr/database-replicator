const express = require('express');
const bodyParser = require('body-parser');
const app = express();
var mysql = require('mysql');
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (request, res) =>  res.sendFile(`C:/Users/Anmol/Desktop/database mirroring/TableUI.html`));

app.post('/api/data', (request, res) => {
  const postBody = request.body;
  var un = postBody.un;
  var pass = postBody.pass;
  var host = postBody.host;
  var db = postBody.db;
  console.log("variables acquired");
  var con = mysql.createConnection({
  host: host,
  user: un,
  password: pass,
  database: db
});
con.connect(function(err) {
	if(err){
		throw err;
	}
else{
	console.log("displaying....");
con.query("SHOW TABLES", function(err,result) {           

          res.write("<table>");
        res.write("<tr>");
        for(var column in result[0]){
            res.write("<td><label>" + column + "</label></td>");
        }
        res.write("</tr>");
        for(var row in result){
            res.write("<tr>");
            for(var column in result[row]){
                res.write("<td><label>" + result[row][column] + "</label></td>");       
            }
            res.write("</tr>");         
        }
        res.end("</table>");
        });
}
});
});
app.listen(4000, () => console.info('Application running on port 4000'));
