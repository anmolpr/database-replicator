/*jshint node: true, esnext : true */
"use strict";

var co = require('co');
var mysql = require('mysql');

function getDatabaseTables(db,tbl) {
    return function(fn) {
        if(tbl==""){
        db.query('SHOW TABLES;', function(err, rows, fields) {
            var tables = [];
            if (err)
                return fn(err);

            for (var i in rows)
                if (rows.hasOwnProperty(i))
                    for (var j in rows[i])
                        if (rows[i].hasOwnProperty(j))
                            tables.push(rows[i][j]);
            
            return fn(null, tables);
        });}
        else{
            db.query("SHOW TABLES LIKE '%"+tbl+"%';", function(err, rows, fields) {
            var tables = [];
            if (err)
                return fn(err);

            for (var i in rows)
                if (rows.hasOwnProperty(i))
                    for (var j in rows[i])
                        if (rows[i].hasOwnProperty(j))
                            tables.push(rows[i][j]);
            
            return fn(null, tables);
        });
        }
    };
}

function getTablesToCreate(remote_db_tables, local_db_tables) {
    return remote_db_tables.filter(function(element) {
        return local_db_tables.indexOf(element) < 0;
    });
}

function getCreateTableStatement(db, table_name) {
    return function(fn) {
        db.query('SHOW CREATE TABLE ' + table_name + ';', function(err, rows, fields) {
            if (err)
                return fn(err);
            return fn(null, rows[0]['Create Table']);
        });
    };
}

function createTable(db, table_definition) {
    return function(fn) {
        db.query("" + table_definition, function(err, rows, fields) {
            if (err)
                return fn(err);
            return fn(null, null);
        });
    };
}

function getMaxTableId(db, table_name, field_name) {
    return function(fn) {
        db.query("SELECT MAX(" + field_name + ") as max_event_no FROM " + table_name, function(err, rows, fields) {
            if (err)
                return fn(err);
            return fn(null, rows[0].max_event_no === null ? -1 : rows[0].max_event_no);
        });
    };
}

function selectRecords(db, table_name, id_field_name, min_id) {
    return function(fn) {
        db.query("SELECT * FROM " + table_name + " WHERE " + id_field_name + '>' +  min_id, function(err, rows, fields) {
            if (err)
                return fn(err);
            return fn(null, rows);
        });
    };
}

function insertRecords(db, table_name, records) {
    return function(fn) {
        var field_list = Object.keys(records[0]).join();
        var record_arr = records.map(function (element) {
            var temp_arr = [];
            for(var i in element) {
                if(element.hasOwnProperty(i))
                    temp_arr.push(element[i]);
            }

            return temp_arr;
        });

        var sql_statement = "INSERT INTO " + table_name + " (" + field_list + ") VALUES ?";
        db.query(sql_statement, [record_arr], function(err, result) {
            if (err)
                return fn(err);
            return fn(null, null);
        });
    };
}


module.exports = co(function* (remotedb_connection, localdb_connection, Num, stb) {
    var remotedb_tables = [],
        tb = stb,
        localdb_tables = [],
        local_tables_to_create = [],
        local_tables_to_create_statements = [],
        localdb_tables_max_id = {},
        remotedb_tables_max_id = {};
    var i, j;
    var tempJSON = {};
    if(tb!="")
        console.log("+Only single table is asked to copy");
    var remotedb = mysql.createConnection(remotedb_connection);
    var localdb = mysql.createConnection(localdb_connection);

    remotedb.connect();
    localdb.connect();
    console.log('+ Connected to remote  and local dbs. Now getting list of tables');

    remotedb_tables = yield getDatabaseTables(remotedb,tb);
    console.log('+ Got list of tables from remote db');

    localdb_tables = yield getDatabaseTables(localdb,tb);
    console.log('+ Got list of tables from local db');

    local_tables_to_create = getTablesToCreate(remotedb_tables, localdb_tables);
    if (local_tables_to_create.length <= 0)
        console.log('+ No need to create tables');
    else console.log('+ Got list of tables that exist remotely but not locally');


    for (i in local_tables_to_create) {
        local_tables_to_create_statements.push(yield getCreateTableStatement(remotedb, local_tables_to_create[i]));
    }
    console.log('+ If there are tables to create locally, got remote db CREATE TABLE statements');


    for (i in local_tables_to_create_statements) {
        yield createTable(localdb, local_tables_to_create_statements[i]);
    }
    console.log('+ If there are tables to create locally, created the tables in local db');

    localdb_tables = yield getDatabaseTables(localdb,tb);
    console.log('+ Got updated list of tables from local db');

    for (i in localdb_tables) {
        localdb_tables_max_id[localdb_tables[i]] = yield getMaxTableId(localdb, localdb_tables[i], Num);
    }
    console.log('+ Got max ids from each table in local db');

    for (i in remotedb_tables) {
        remotedb_tables_max_id[remotedb_tables[i]] = yield getMaxTableId(remotedb, remotedb_tables[i], Num);
    }
    console.log('+ Got max ids from each table in remote db');

    var records;
    for (i in remotedb_tables_max_id) {
        if(remotedb_tables_max_id[i] > localdb_tables_max_id[i]) {
            records = yield selectRecords(remotedb, i, Num, localdb_tables_max_id[i]);
            yield insertRecords(localdb, i, records);
        }
    }

    console.log('+ Inserted all records');

    remotedb.end();
    localdb.end();
});