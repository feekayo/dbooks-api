var mongoose = require('mongoose'),
	shortid = require('shortid');

var reviewSchema = new mongoose.Schema({
	id:  {type: String, unique: true, require: true, 'default': shortid.generate},
	book_id: {type: String, require: true},
	user_id: {type: String, require: true},
	author: {type: String, require: true},
	permlink: {type: String, require: true},
	content: {type: String, require: true},
	rating: {type: Number, require: true},
	created: {type: Date, require: true, 'default': Date.now}
});

var Review = mongoose.model('reviews',reviewSchema);

var exports = module.exports;

exports.create_review = function(requestBody,response){

	response.data = {};

	var Review = toReview(requestBody);

	Review.save(function(error){
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
            response.data.log = "Review Added";//log response
            response.data.success = 1;
            response.end(JSON.stringify(response.data));   
            return; 			
		}
	})
}

exports.fetch_reviews = function(requestBody,response){
	response.data = {};

	var aggregate = [{
		$match: {book_id: requestBody.book_id}
	},{
		$sort: {'created': -1}
	}]

	Review.aggregate(aggregate,function(error,data){
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
	            response.data.log = "Reviews Fetched";//log response
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

function toReview(data){
	return new Review({
		book_id: data.book_id,
		user_id: data.user_id,
		author: data.author,
		permlink: data.permlink,
		content: data.content,
		rating: data.rating
	})
}