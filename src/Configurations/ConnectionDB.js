const mysql = require("mysql");
require('dotenv').config();
const util = require("util");

const db = mysql.createConnection({
    host: "final-project-db.ciczv72xckhl.us-east-1.rds.amazonaws.com",
    port: "3306",
    user: "admin",
    password: "pass123!",
    database: "FinalProjectDB"
});

db.query = util.promisify(db.query).bind(db);

db.connect((err) => {
    if (err) {
        console.log(err.message);
        return;
    }
    console.log("Database Connected!")

});

module.exports = db;