const mysql = require("mysql");
require('dotenv').config();
const util = require("util");
// const AWS = require('aws-sdk');
// const awsParamStore = require('aws-param-store');

// AWS.config.loadFromPath('./src/Configurations/config.json');
// awsParamStore.getParametersByPath('/db/user', { region: 'us-east-1' })
//     .then((parameters) => {

//         console.log('parameters :>> ', parameters);
//     });
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