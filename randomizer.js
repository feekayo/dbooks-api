var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017/spotpin',function(err,db){
    console.log("Connected to server");
    
    db.close();
});
