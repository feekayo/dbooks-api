var mongoose = require('mongoose'),
	shortid = require('shortid');
	
var favoritesSchema = new mongoose.Schema({
	id: {type: String, unique: true, require: true, 'default': shortid.generate},
	book_id: {type: String, require: true},
	user_id: {type: String, require: true},
	timestamp: {type: Date, 'default': Date.now}
});

var Favorites = mongoose.model('Favorites',favoritesSchema);

var exports = module.exports;

exports.favorite_model = Favorites; 

exports.create_favorites = function(requestBody,response){
	var user_id = requestBody.user_id,
		book_id = requestBody.book_id;
		
		response.data = {};
		
	Favorites.findOne({$and: [{book_id: book_id},{user_id: user_id}]},function(error,data){
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
                response.data.log = "Liked";//log response
                response.data.success = 1;
                response.end(JSON.stringify(response.data));   
                return;    			
			}else{
				var Favorite = toFavorites(requestBody);
				
				Favorite.save(function(error){
					if(error){
						response.writeHead(500,{'Content-Type':'application/json'});//set response type
						response.data.log = "Error Liking";//log response
						response.data.success = 0;
						response.end(JSON.stringify(response.data));   
						return;					
					}else{
						response.writeHead(200,{'Content-Type':'application/json'});//set response type
						response.data.log = "Liked";//log response
						response.data.success = 1;
						response.end(JSON.stringify(response.data));   
						return;    								
					}
				})
			}
		}
	});
	
}

exports.delete_favorites =  function(requestBody,response){
	var user_id = requestBody.user_id,
		book_id = requestBody.book_id;
		
		response.data = {};
		
	Favorites.findOne({$and: [{book_id: book_id},{user_id: user_id}]},function(error,data){
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
				data.remove(function(error){
					if(error){
						response.writeHead(500,{'Content-Type':'application/json'});//set response type
						response.data.log = "Error Un-Liking";//log response
						response.data.success = 0;
						response.end(JSON.stringify(response.data));   
						return;					
					}else{
						response.writeHead(200,{'Content-Type':'application/json'});//set response type
						response.data.log = "Un-Liked";//log response
						response.data.success = 1;
						response.end(JSON.stringify(response.data));   
						return;    								
					}
				});  			
			}else{
                response.writeHead(200,{'Content-Type':'application/json'});//set response type
                response.data.log = "Record Not Found!";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return;  
			}
		}
	});
	
}

exports.fetch_favorites = function(requestBody,response){
	
	response.data = {};
	console.log(requestBody.user_id);
	var aggregate = [{
		$match: {user_id: requestBody.user_id}
	},{
		$lookup: {
			from: "books",
			foreignField: "id",
			localField: "book_id",
			as: "book_data"
		}
	},{
		$lookup: {
			from: "chapters",
			foreignField: "book_id",
			localField: "book_id",
			as: "chapter_data"
		}
	},{
		$lookup: {
			from: 'reviews',
			foreignField: 'book_id',
			localField: 'book_id',
			as: 'reviews_data'
		}
	},{
		$project: {
			id: 1,
			book_id: 1,
			user_id: 1,
			timestamp: 1,
			rating_num: {$size: '$reviews_data'},
			rating: {$avg: '$reviews_data.rating'}, 			
			chapter_num: {$size: '$chapter_data'},
			book_data: 1			
		}
	},{
		$skip: (requestBody.page_num-1) * 60
	},{
			$sort: {'timestamp': -1}
	},{
		$limit: 60
	}]
	
	Favorites.aggregate(aggregate,function(error,data){
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
				response.data.log = "Data Fetched";//log response
				response.data.data = data;
				response.data.success = 1;
				response.end(JSON.stringify(response.data));   
				return;    							
			}else{
                response.writeHead(200,{'Content-Type':'application/json'});//set response type
                response.data.log = "No Favorites";//log response
                response.data.success = 1;
                response.end(JSON.stringify(response.data));   
                return;  			
			}
		}
		
	});
}

function toFavorites(data){
	return new Favorites({
		book_id: data.book_id,
		user_id: data.user_id,	
	})
}
	