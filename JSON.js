"use strict";

// This is the database we want to mirror
var co = require('co');
module.exports = co(function* (sd,dd,sh,dh,sun,dun,spass,dpass,stb) {


var remotedb_json = {
    host: sh,
    user: sun,
    password: spass,
    database: sd
};

// This is the destination database
var destinationdb_json = {
    host: dh,
    user: dun,
    password: dpass,
    database: dd
};

var msg =  require('./replicate.js')(remotedb_json, destinationdb_json, 'Num',stb);
console.log(msg);})