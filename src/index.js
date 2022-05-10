const express = require('express');
const app = express();
var cors = require('cors');
const fileUpload = require('express-fileupload');


app.set('port', process.env.PORT || 5800);
app.use(cors());

app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//app.use(require('./Routes/Routes.js')); //Donde se hacen todos los endpoints
app.use(require('./Routes/Routes2.js'));
app.listen(app.get('port'), () => {
    console.log("Server listening in port ", app.get('port'));
});