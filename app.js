var express = require('express'), //require express
    config = require('./server/configure'), //configure serverr
    app = express(); //invoke express
    mongoose = require('mongoose'); //require mongoose
    app.set('port',process.env.PORT||3300); //set port to environment port or 3000
    app.set('views',__dirname+'/views'); //ser views directory
    app = config(app); //invoke app config

mongoose.connect('mongodb://test:tester1@ds219181.mlab.com:19181/heroku_0jf9v6xc');//test environment database

//mongoose.connect('mongodb://localhost/dbooks'); //offline test database 

mongoose.connection.on('open',function(){ //connect to mongoose
   console.log('Mongoose Connected.'); //log connection message
});


app.listen(app.get('port'),function(){ //listen to port
    console.log (app.get('port')); //log port being listened to
});
