var mongoose = require('mongoose');


var Schema = new mongoose.Schema({
    name: {type: String, require: true},
    phone: {type: String, require: true},
    email: {type: String, require: true}
});


var CollectionModel = mongoose.model('collection',Schema);

exports create_model = function(data){
    
    var Collection = toCollectionModel(data);
    
    Collection.save(function(error){
        if(error){
            console.log("Error saving data");
        }else{
            console.log("Successfully saved data!")
        }
    })
}

function toCollectionModel(data){
    return new CollectionModel({
        names: data.model,
        phone: data.phone,
        email: data.email
    })
}