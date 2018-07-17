var mongoose = require("mongoose"),
	shortid = require("shortid");
	
var  ratingsSchema = new mongoose.Schema({
	id: {type: String, unique: true, require: true, 'default':shortid.generate},
	user_id: {type: String, require: true},
	book_id: {type: String, require: true},
	rating: {type: Number, require: true},
	review: {type: String, require: true},
	created: {type: Date, require: true, 'default': Date.now}
});

var Ratings = mongoose.model('ratings',usersSchema);

var exports = module.exports;

exports.add_review = function(requestBody,response){
	response.data = {};
	
	var Rating = toRatings(requestBody);

	Rating.save(function(error){
		if(error){
            if(response==null){
                response.writeHead(500,{'Content-Type':'application/json'});//set response type
                response.data.log = "Internal Server Error";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return;                  
            }else{
                console.log(error);
                response.writeHead(500,{'Content-Type':'application/json'});//set response type
                response.data.log = "Database Error";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return;                
            }  			
		}else{
            response.writeHead(200,{'Content-Type':'application/json'});//set response type
            response.data.log = "Review Saved";//log response
            response.data.success = 1;
            response.end(JSON.stringify(response.data));   
            return; 		
		}
	});
}

exports.fetch_ratings = function(requestBody,response){
	
	response.data = {};
	
	var book_id = requestBody.book_id
	//add pagination using  mongoose aggregate function

    Ratings.find({book_id: book_id},function(error,data){
		if(error){
            if(response==null){
                response.writeHead(500,{'Content-Type':'application/json'});//set response type
                response.data.log = "Internal Server Error";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return;                  
            }else{
                console.log(error);
                response.writeHead(500,{'Content-Type':'application/json'});//set response type
                response.data.log = "Database Error";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return;                
            }  		
		}else{
			if(data && Object.keys(data).length>0){
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
                response.data.log = "Review Fetched";//log response
				response.data.data = data;
                response.data.success = 1;
                response.end(JSON.stringify(response.data));   
                return; 
			}else{
                response.writeHead(200,{'Content-Type':'application/json'});//set response type
                response.data.log = "No Reviews";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return; 				
			}
		}
	});
}

exports.fetch_reviews = function(requestBody,response){

}

function toRatings(data){
	return new Ratings({
		user_id: data.user_id,
		book_id: data.book_id,
		rating: data.rating,
		review: data.review,	
	});
}