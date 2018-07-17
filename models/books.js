var mongoose = require("mongoose"),
	Favorites = require('./favorites'),
	Rentals = require('./rental'),
	Coupons = require('./coupons'),
	shortid = require("shortid");
	
var  booksSchema = new mongoose.Schema({
	user_id: {type: String, require: true},
	id: {type: String, unique: true, require: true},
	title: {type: String},
	img: {
		bucket: {type: String, require: true},
		object: {type: String, require: true}
	},
	genre: {type: String, require: true},
	synopsis: {type: String, require: true},
	prologue: {
		author: {type:String},
		permlink: {type: String},
		content: {type: String}
	},
	epilogue:  {
		author: {type:String},
		permlink: {type: String},
		content: {type: String}
	},
	language: {type: String, require: true},	
	other_language: {type: String},
	premium: {type: Boolean, require: true},
	closed: {type: Boolean, require: true, 'default': false},
	rental_price: {type: Number},
	last_updated: {type: Date, require: true, 'default':Date.now},
	created: {type: Date, require: true}
});

var Books = mongoose.model('books',booksSchema);

var voteSchema = new mongoose.Schema({
	id: {type: String, unique: true, require: true, 'default':shortid.generate}, 
	user_id: {type: String, require: true},
	permlink: {type: String,require: true}
})

var Vote = mongoose.model('votes',voteSchema);

var chaptersSchema = new mongoose.Schema({
	id: {type: String, unique: true, require: true, 'default':shortid.generate},
	book_id: {type: String, require: true},
	chapter_title: {type: String, require: true},
	steemit_published: {type: Boolean, require: true},
	chapter_content: {type: String, require: true},
	chapter_number: {type: Number, require: true},
	author: {type: String},
	permlink: {type: String},
	last_updated: {type: Date, require: true, 'default':Date.now},
	created: {type: Date, require: true}	
})

var chapterReadsSchema = new mongoose.Schema({
	id: {type: String, unique: true, require: true, 'default': shortid.generate},
	user_id: {type: String, require: true},
	book_id: {type: String, require: true},
	chapter_number: {type: Number, require: true},
	timestamp: {type: Date,'default': Date.now}
});

var Reads = mongoose.model('chapter_reads',chapterReadsSchema);

var Chapters = mongoose.model('chapters',chaptersSchema);

var exports = module.exports;


exports.check_book_lock_callback = function(book_id,callback){
	Books.findOne({$and: [{id: book_id},{closed: true}]},function(error,data){
		if(error){
			callback(false);
		}else{
			if(data && Object.keys(data).length>0){
				callback(true);
			}else{
				callback(false);
			}
		}
	})
}

exports.fetch_recent_reads = function(requestBody,response){
	response.data = {};

	var user_id = requestBody.user_id;

	var aggregate = [{
		$match: {user_id: user_id}
	},{
		$group: {_id: '$book_id',chapters_read:{$sum:1},last_read: {$last: '$chapter_number'}}
	},{
		$lookup: {
			from: 'books',
			foreignField: 'id',
			localField: '_id',
			as: 'book_data'
		}
	},{
		$lookup: {
			from: 'users',
			foreignField: 'id',
			localField: 'book_data.user_id',
			as: 'user_data'
		}
	},{
		$lookup: {
			from: 'chapters',
			foreignField: 'book_id',
			localField: '_id',
			as: 'chapters_data'
		}
	},{
		$lookup: {
			from: 'reviews',
			foreignField: 'book_id',
			localField: '_id',
			as: 'reviews_data'
		}
	},{
		$project: {
			_id: 1,
			chapters_read: 1,
			book_data: 1,
			user_data: 1,
			last_read: 1,
			rating_num: {$size: '$reviews_data'},
			rating: {$avg: '$reviews_data.rating'}, 			
			chapters_num: {$size: '$chapters_data'}
		}
	},{
		$limit: 10
	},{
		$sort: {'_id': -1}
	}]

	Reads.aggregate(aggregate,function(error,data){
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
			console.log(data);
			if(data && Object.keys(data).length>0){
				response.writeHead(200,{'Content-Type':'application/json'});//set response type	
				response.data.log = "Books Fetched";//log response
				response.data.data= data
				response.data.success = 1;
				response.end(JSON.stringify(response.data)); 

			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "No Books Found";//log response
				response.data.success = 0;
				response.end(JSON.stringify(response.data));			
			}
		}
	})
}	

exports.fetch_book_chapters = function(requestBody,response){

	response.data = {};

	var book_id = requestBody.book_id,
		chapter_number = requestBody.chapter_number;
	Chapters.find({$and: [{book_id: book_id},{chapter_number: chapter_number}]},function(error,data){
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
		
				Reads.findOne({$and: [{book_id: book_id},{chapter_number: chapter_number},{user_id:requestBody.user_id}]},function(error,edata){

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
						if(edata){
							edata.timestamp = Date.now();

							edata.save(function(error){
								response.writeHead(200,{'Content-Type':'application/json'});//set response type
								response.data.log = "Chapters Fetched";//log response
								response.data.success = 1;
								response.data.chapters_data = data;
								response.end(JSON.stringify(response.data)); 
							});								
						}else{
							var ChapterReads = toChapterRead(book_id, chapter_number, requestBody.user_id);
							
							ChapterReads.save(function(error){

								Vote.findOne({$and: [{user_id: requestBody.user_id},{permlink: data.permlink}]},function(error,edata){
									if(edata && Object.keys(edata).length>0){
										response.writeHead(200,{'Content-Type':'application/json'});//set response type
										response.data.log = "Chapters Fetched";//log response
										response.data.success = 1;
										response.data.voted = true;
										response.data.chapters_data = data;
										response.end(JSON.stringify(response.data));
									}else{
										response.writeHead(200,{'Content-Type':'application/json'});//set response type
										response.data.log = "Chapters Fetched";//log response
										response.data.success = 1;
										response.data.voted = false;
										response.data.chapters_data = data;
										response.end(JSON.stringify(response.data));
									}
								});
 
							});		
						}
					}
				});								
				
			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "No chapter published yet";//log response
				response.data.success = 0;		
				response.end(JSON.stringify(response.data)); 
			}
		}
	})
}

exports.update_chapter = function(requestBody,response){
	var chapter_title = requestBody.chapter_title,
		chapter_content = requestBody.chapter_content,
		book_id = requestBody.book_id,
		permlink = requestBody.permlink,
		user_id = requestBody.user_id;

	console.log(requestBody);

	response.data = {};
	Books.findOne({$and: [{id: book_id},{user_id: user_id}]},function(error,data){
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
			if(data){
				Chapters.findOne({$and: [{permlink: permlink},{book_id: book_id}]},function(error,data){
					if(data){
						data.chapter_title = chapter_title;
						data.chapter_content = chapter_content;

						data.save(function(error){
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
				                response.data.log = "Chapter Updated";//log response
				                response.data.success = 1;
				                response.end(JSON.stringify(response.data));   
				                return; 							
							}
						})
					}else{
		                response.writeHead(200,{'Content-Type':'application/json'});//set response type
		                response.data.log = "Chapter not found!";//log response
		                response.data.success = 0;
		                response.end(JSON.stringify(response.data));   
		                return; 						
					}
				});
			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "Book doesn't exist";//log response
				response.data.success = 0;		
				response.end(JSON.stringify(response.data)); 				
			}
		}
	})

}


exports.update_logues = function(requestBody,response){
	var book_id = requestBody.book_id,
		user_id = requestBody.user_id;

	response.data = {};

	Books.findOne({$and: [{id: book_id},{user_id: user_id}]},function(error,data){
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
		
				if(requestBody.param=="epilogue"){
					data.epilogue.author = requestBody.author;
					data.epilogue.permlink = requestBody.permlink;
					data.epilogue.content = requestBody.value;
				}else if(requestBody.param=="prologue"){
					data.prologue.author = requestBody.author;
					data.prologue.permlink = requestBody.permlink;
					data.prologue.content = requestBody.value;
				}

				console.log(requestBody);

				data.save(function(error){
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
		                response.data.log = "Book Updated";//log response
		                response.data.success = 1;
		                response.end(JSON.stringify(response.data));   
		                return; 	
					}
				}) 

			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "Book doesn't exist";//log response
				response.data.success = 0;		
				response.end(JSON.stringify(response.data)); 				
			}
		}		
	})	
}

exports.update_book = function(requestBody,response){
	var book_id = requestBody.book_id,
		user_id = requestBody.user_id,
		title = requestBody.title,
		bucket = requestBody.bucket,
		object = requestBody.object,
		genre = requestBody.genre,
		synopsis = requestBody.synopsis;

	response.data = {};

	Books.findOne({$and: [{id: book_id},{user_id: user_id}]},function(error,data){
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
				data.title = title;
				data.img.bucket = bucket;
				data.img.object = object;
				data.genre = genre;
				data.synopsis = synopsis;

				data.save(function(error){
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
		                response.data.log = "Book Updated";//log response
		                response.data.success = 1;
		                response.end(JSON.stringify(response.data));   
		                return; 	
					}
				}) 

			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "Book doesn't exist";//log response
				response.data.success = 0;		
				response.end(JSON.stringify(response.data)); 				
			}
		}		
	})
}

exports.fetch_book = function(requestBody,response){
	var book_id = requestBody.book_id;
	
	response.data = {};
	
	var aggregate = [{
		$match: {id: book_id}
	},{
		$lookup: {
			from:'users',
			foreignField: 'id',
			localField: 'user_id',
			as: "user_data"
		}
	},{
		$lookup: {
			from: 'chapters',
			foreignField: 'book_id',
			localField: 'id',
			as: 'chapter_data'
		}
	},{
		$lookup: {
			from: 'favorites',
			foreignField: 'book_id',
			localField: 'id',
			as: 'favorites_data'
		} 

	},{
		$lookup: {
			from: 'reviews',
			foreignField: 'book_id',
			localField: 'id',
			as: 'reviews_data'
		}
	},{
		$project: {
			user_id: 1,
			id: 1,
			title: 1,
			img_url: 1,
			genre: 1,
			synopsis: 1,
			prologue: 1,
			epilogue: 1,
			language: 1,
			other_language: 1,
			premium: 1,
			closed: 1,
			rental_price: 1,
			last_updated: 1,
			created: 1,
			user_data: {
				pen_name: 1,
				user_email: 1,
				steemit_username: 1
			},
			rating_num: {$size: '$reviews_data'},
			rating: {$avg: '$reviews_data.rating'}, 
			chapter_num: {$size: '$chapter_data'},
			favorites_num: {$size: '$favorites_data'}			
		}
	}];
	
	Books.aggregate(aggregate,function(error,data){
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
				Favorites.favorite_model.findOne({$and: [{book_id: requestBody.book_id},{user_id: requestBody.user_id}]},function(error,edata){
					console.log(edata)
					if(edata && Object.keys(edata).length>0){
						response.data.liked = true;
					}else{
						response.data.liked = false;
					}
			

					if(data[0].rental_price>0){
						Rentals.validate_rental(requestBody.user_id,requestBody.book_id,function(validated){
							if(validated){
								response.data.all_access = true;
							}else{
								response.data.all_access = false;

								Coupons.CouponsModel.findOne({$and: [{user_id: requestBody.user_id},{book_id: requestBody.book_id}]},function(error,ddata){
									
									if(data && Object.keys(data).length>0){
										response.data.coupon_data = ddata;
									}
									
									response.data.log = "Book Fetched";//log response
									response.data.data= data
									response.data.success = 1;
									response.end(JSON.stringify(response.data)); 									
								})
							}
						})
					}else{
						console.log(data);
						response.data.log = "Book Fetched";//log response
						response.data.data= data
						response.all_access = true;
						response.data.success = 1;
						response.end(JSON.stringify(response.data)); 
					}
				});
			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "Book Not Found";//log response
				response.data.success = 0;
				response.end(JSON.stringify(response.data));			
			}
		}
	})
}

exports.fetch_my_books = function(requestBody,response){
	var user_id = requestBody.user_id;
	
	response.data = {};
	
	var aggregate = [{
		$match: {user_id: user_id}
	},{
		$lookup: {
			from:'users',
			foreignField: 'id',
			localField: 'user_id',
			as: "user_data"
		}
	},{
		$lookup: {
			from: 'chapters',
			foreignField: 'book_id',
			localField: 'id',
			as: 'chapter_data'
		}
	},{
		$lookup: {
			from: 'reviews',
			foreignField: 'book_id',
			localField: 'id',
			as: 'reviews_data'
		}
	},{
		$project: {
			user_id: 1,
			id: 1,
			title: 1,
			img_url: 1,
			genre: 1,
			synopsis: 1,
			closed: 1,
			language: 1,
			other_language: 1,
			premium: 1,
			rental_price: 1,
			last_updated: 1,
			created: 1,
			user_data: {
				pen_name: 1,
				user_email: 1,
				steemit_username: 1
			},
			rating_num: {$size: '$reviews_data'},
			rating: {$avg: '$reviews_data.rating'}, 
			chapter_num: {$size: '$chapter_data'}			
		}
	},{
			$sort: {'created': -1}
	}];
	
	Books.aggregate(aggregate,function(error,data){
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
				Favorites.favorite_model.findOne({$and: [{book_id: requestBody.book_id},{user_id: requestBody.user_id}]},function(error,edata){
					console.log(edata)
					if(edata && Object.keys(edata).length>0){
						response.data.liked = true;
					}else{
						response.data.liked = false;
					}
			
					response.data.log = "Book Fetched";//log response
					response.data.data= data
					response.data.success = 1;
					response.end(JSON.stringify(response.data)); 
				});
			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "No Books Found";//log response
				response.data.success = 0;
				response.end(JSON.stringify(response.data));			
			}
		}
	})
}

exports.create_books = function(requestBody,response){

	var title = requestBody.title,
		user_id = requestBody.user_id;
		
	response.data = {};

	Books.findOne({$and: [{title: title},{user_id: user_id}]},function(error,data){
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
                response.data.log = "Title already in publication";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return;			
			}else{
				var random = Math.floor(Math.random()*9) + 1;
				var id = title.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'')+"-"+random;
				var Book = toBooks(id,requestBody);
				
				Book.save(function(error){
					if(error){
						response.writeHead(200,{'Content-Type':'application/json'});//set response type
						response.data.log = "Book Creation Failed";//log response
						response.data.success = 0;
						response.end(JSON.stringify(response.data));   
						return;					
					}else{
						response.writeHead(200,{'Content-Type':'application/json'});//set response type
						response.data.log = "Book Created";//log response
						response.data.success = 1;
						response.data.book_id = id;
						response.end(JSON.stringify(response.data));   
						return;  						 								
					}
				})
			}
		}
	});
}


/**Not enabled yet... Incomplete implementation**/
exports.delete_books = function(requestBody,response){ //make sure you check for active subscriptions before you allow for deletion
	var book_id = requestBody.book_id,
		user_id = requestBody.user_id;
	
	response.data = {};
	
	Books.findOne({$and: [{id: book_id},{user_id: user_id}]},function(error,data){
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
						response.writeHead(200,{'Content-Type':'application/json'});//set response type
						response.data.log = "Book Deletion Failed";//log response
						response.data.success = 0;
						response.end(JSON.stringify(response.data));   
						return;					
					}else{
					
						Chapters.remove({book_id: book_id},function(error){ //delete chapters of the book
							response.writeHead(200,{'Content-Type':'application/json'});//set response type
							response.data.log = "Book Deleted!";//log response
							response.data.success = 1;
							response.end(JSON.stringify(response.data));   
							return;  						
						});  								
					}
				})
				
			}else{
                response.writeHead(200,{'Content-Type':'application/json'});//set response type
                response.data.log = "Book record not found!";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return; 			
			}
		}
	});
}

exports.add_chapter = function(requestBody,response){

	response.data = {};
	
	var user_id = requestBody.user_id,
		book_id = requestBody.book_id,
		chapter_title = requestBody.chapter_title,
		chapter_number = requestBody.chapter_number,
		author = requestBody.author,
		permlink = requestBody.permlink;
		
	Books.findOne({$and: [{id: book_id},{user_id:user_id}]},function(error,data){
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
				Chapters.findOne({$and: [{book_id: book_id},{chapter_number: chapter_number}]},function(error,data){
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
							response.data.log = "Chapter Already Published";//log response
							response.data.success = 0;
							response.end(JSON.stringify(response.data));   
							return;			
						}else{
							var Chapter = toChapters(requestBody);
							
							Chapter.save(function(error){
								if(error){
									response.writeHead(200,{'Content-Type':'application/json'});//set response type
									response.data.log = "Failed to add Chapter";//log response
									response.data.success = 0;
									response.end(JSON.stringify(response.data));   
									return;					
								}else{
									response.writeHead(200,{'Content-Type':'application/json'});//set response type
									response.data.log = "Chapter Added";//log response
									response.data.success = 1;
									response.end(JSON.stringify(response.data));   
									return;  						 								
								}
							})
						}
					}
				});			
			}else{
                response.writeHead(200,{'Content-Type':'application/json'});//set response type
                response.data.log = "User Unauthorized!";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return; 			
			}
		}
	});	

}

exports.fetch_category = function(requestBody,response){
	var genre = requestBody.genre;
	
	response.data = {};
	
	if(genre!='All'){
		var aggregate = [{
			$match: {genre: genre}
		},{
			$lookup: {
				from:'users',
				foreignField: 'id',
				localField: 'user_id',
				as: "user_data"
			}
		},{
			$lookup: {
				from: 'chapter_reads',
				foreignField: 'book_id',
				localField: 'id',
				as: "reads"
			}
		},{
			$lookup: {
				from: 'chapters',
				foreignField: 'book_id',
				localField: 'id',
				as: 'chapters'
			}
		},{
			$lookup: {
				from: 'favorites',
				foreignField: 'book_id',
				localField: 'id',
				as: 'favorites_data'
			} 
		},{
			$lookup: {
				from: 'reviews',
				foreignField: 'book_id',
				localField: 'id',
				as: 'reviews_data'
			}
		},{
			$project: {
				user_id: 1,
				id: 1,
				title: 1,
				img_url: 1,
				genre: 1,
				synopsis: 1,
				language: 1,
				other_language: 1,
				premium: 1,				
				closed: 1,
				rental_price: 1,
				last_updated: 1,
				created: 1,
				user_data: {
					pen_name: 1,
					user_email: 1,
					steemit_username: 1
				},
				rating_num: {$size: '$reviews_data'},
				rating: {$avg: '$reviews_data.rating'}, 				
				reads_num: {$size: "$reads"},
				chapters_num: {$size: "$chapters"},
				favorites_num: {$size: "$favorites_data"}			
			}
		},{
			$sort: {'reads_num': -1}
		},{
	        $skip: (requestBody.page_num-1) * 60
	    },{
	        $limit: 60
	    }]
	}else{
var aggregate = [{
			$match: {}
		},{
			$lookup: {
				from:'users',
				foreignField: 'id',
				localField: 'user_id',
				as: "user_data"
			}
		},{
			$lookup: {
				from: 'chapter_reads',
				foreignField: 'book_id',
				localField: 'id',
				as: "reads"
			}
		},{
			$lookup: {
				from: 'chapters',
				foreignField: 'book_id',
				localField: 'id',
				as: 'chapters'
			}
		},{
			$lookup: {
				from: 'favorites',
				foreignField: 'book_id',
				localField: 'id',
				as: 'favorites_data'
			} 
		},{
			$lookup: {
				from: 'reviews',
				foreignField: 'book_id',
				localField: 'id',
				as: 'reviews_data'
			}
		},{
			$project: {
				user_id: 1,
				id: 1,
				title: 1,
				img_url: 1,
				genre: 1,
				synopsis: 1,
				closed: 1,
				language: 1,
				other_language: 1,
				premium: 1,
				rental_price: 1,
				last_updated: 1,
				created: 1,
				user_data: {
					pen_name: 1,
					user_email: 1,
					steemit_username: 1
				},
				rating_num: {$size: '$reviews_data'},
				rating: {$avg: '$reviews_data.rating'}, 		
				reads_num: {$size: "$reads"},
				chapters_num: {$size: "$chapters"},
				favorites_num: {$size: "$favorites_data"}			
			}
		},{
			$sort: {'reads_num': -1}
		},{
	        $skip: (requestBody.page_num-1) * 60
	    },{
	        $limit: 60
	    }]
	}
	
	
	Books.aggregate(aggregate,function(error,data){
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
				response.data.log = "Books Fetched";//log response
				response.data.success = 1;
				response.data.data = data;
				response.end(JSON.stringify(response.data)); 
			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "No Books Found";//log response
				response.data.success = 0;
				response.data.data = data;
				response.end(JSON.stringify(response.data)); 
			}
		}
	})
}

exports.fetch_category_language = function(requestBody,response){
	var genre = requestBody.genre,
		language = requestBody.language;
		
	response.data = {};
	
	if(genre!='All'){
		var aggregate = [{
			$match: {$and: [{genre: genre},{language: language}]}
		},{
			$lookup: {
				from:'users',
				foreignField: 'id',
				localField: 'user_id',
				as: "user_data"
			}
		},{
			$lookup: {
				from: 'chapter_reads',
				foreignField: 'book_id',
				localField: 'id',
				as: "reads"
			}
		},{
			$lookup: {
				from: 'chapters',
				foreignField: 'book_id',
				localField: 'id',
				as: 'chapters'
			}
		},{
			$lookup: {
				from: 'favorites',
				foreignField: 'book_id',
				localField: 'id',
				as: 'favorites_data'
			} 
		},{
			$lookup: {
				from: 'reviews',
				foreignField: 'book_id',
				localField: 'id',
				as: 'reviews_data'
			}
		},{
			$project: {
				user_id: 1,
				id: 1,
				title: 1,
				img_url: 1,
				genre: 1,
				synopsis: 1,
				language: 1,
				other_language: 1,
				premium: 1,				
				closed: 1,
				rental_price: 1,
				last_updated: 1,
				created: 1,
				user_data: {
					pen_name: 1,
					user_email: 1,
					steemit_username: 1
				},
				rating_num: {$size: '$reviews_data'},
				rating: {$avg: '$reviews_data.rating'}, 				
				reads_num: {$size: "$reads"},
				chapters_num: {$size: "$chapters"},
				favorites_num: {$size: "$favorites_data"}			
			}
		},{
			$sort: {'reads_num': -1}
		},{
	        $skip: (requestBody.page_num-1) * 60
	    },{
	        $limit: 60
	    }]
	}else{
		var aggregate = [{
			$match: {language: language}
		},{
			$lookup: {
				from:'users',
				foreignField: 'id',
				localField: 'user_id',
				as: "user_data"
			}
		},{
			$lookup: {
				from: 'chapter_reads',
				foreignField: 'book_id',
				localField: 'id',
				as: "reads"
			}
		},{
			$lookup: {
				from: 'chapters',
				foreignField: 'book_id',
				localField: 'id',
				as: 'chapters'
			}
		},{
			$lookup: {
				from: 'favorites',
				foreignField: 'book_id',
				localField: 'id',
				as: 'favorites_data'
			} 
		},{
			$lookup: {
				from: 'reviews',
				foreignField: 'book_id',
				localField: 'id',
				as: 'reviews_data'
			}
		},{
			$project: {
				user_id: 1,
				id: 1,
				title: 1,
				img_url: 1,
				genre: 1,
				synopsis: 1,
				closed: 1,
				language: 1,
				other_language: 1,
				premium: 1,
				rental_price: 1,
				last_updated: 1,
				created: 1,
				user_data: {
					pen_name: 1,
					user_email: 1,
					steemit_username: 1
				},
				rating_num: {$size: '$reviews_data'},
				rating: {$avg: '$reviews_data.rating'}, 				
				reads_num: {$size: "$reads"},
				chapters_num: {$size: "$chapters"},
				favorites_num: {$size: "$favorites_data"}			
			}
		},{
			$sort: {'reads_num': -1}
		},{
	        $skip: (requestBody.page_num-1) * 60
	    },{
	        $limit: 60
	    }]
	}
	
	
	Books.aggregate(aggregate,function(error,data){
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
				response.data.log = "Books Fetched";//log response
				response.data.success = 1;
				response.data.data = data;
				response.end(JSON.stringify(response.data)); 
			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "No Books Found";//log response
				response.data.success = 0;
				response.data.data = data;
				response.end(JSON.stringify(response.data)); 
			}
		}
	})
}


exports.fetch_popular_home = function(response){
	
	response.data = {};

	var aggregate = [{
			$match: {}
		},{
			$lookup: {
				from:'users',
				foreignField: 'id',
				localField: 'user_id',
				as: "user_data"
			}
		},{
			$lookup: {
				from: 'chapter_reads',
				foreignField: 'book_id',
				localField: 'id',
				as: "reads"
			}
		},{
			$lookup: {
				from: 'chapters',
				foreignField: 'book_id',
				localField: 'id',
				as: 'chapters'
			}
		},{
			$lookup: {
				from: 'favorites',
				foreignField: 'book_id',
				localField: 'id',
				as: 'favorites_data'
			} 
		},{
			$project: {
				user_id: 1,
				id: 1,
				title: 1,
				img_url: 1,
				genre: 1,
				synopsis: 1,
				closed: 1,
				language: 1,
				other_language: 1,
				premium: 1,
				rental_price: 1,
				last_updated: 1,
				created: 1,
				user_data: {
					pen_name: 1,
					user_email: 1,
					steemit_username: 1
				},
				reads_num: {$size: "$reads"},
				chapters_num: {$size: "$chapters"},
				favorites_num: {$size: "$favorites_data"}			
			}
		},{
			$sort: {'reads_num': -1}
		},{
	        $limit: 7
	    }]
	
	
	Books.aggregate(aggregate,function(error,data){
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
				response.data.log = "Books Fetched";//log response
				response.data.success = 1;
				response.data.data = data;
				response.end(JSON.stringify(response.data)); 
			}else{
				response.writeHead(200,{'Content-Type':'application/json'});//set response type
				response.data.log = "No Books Found";//log response
				response.data.success = 0;
				response.data.data = data;
				response.end(JSON.stringify(response.data)); 
			}
		}
	})
}

exports.close_book = function(requestBody,response){
	var book_id = requestBody.book_id,
		user_id = requestBody.user_id;
	
	response.data = {};
	
	Books.findOne({$and: [{id: book_id},{user_id: user_id}]},function(error,data){
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
				data.closed = true;
				data.rental_price = requestBody.rental_price;
				
				data.save(function(error){
					if(error){
						response.writeHead(500,{'Content-Type':'application/json'});//set response type
						response.data.log = "Book Closing Failed";//log response
						response.data.success = 0;
						response.end(JSON.stringify(response.data));   
						return;					
					}else{
						response.writeHead(200,{'Content-Type':'application/json'});//set response type
						response.data.log = "Book Closed and Purchase Fee set as "+data.rental_price+" SBD";//log response
						response.data.success = 1;
						response.end(JSON.stringify(response.data));   
						return;    								
					}
				})
				
			}else{
                response.writeHead(200,{'Content-Type':'application/json'});//set response type
                response.data.log = "Unauthorized Request";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return; 			
			}
		}
	});
}

exports.update_rental_price = function(requestBody,response){
	var book_id = requestBody.book_id,
		user_id = requestBody.user_id;
	
	response.data = {};
	
	Books.findOne({$and: [{id: book_id},{user_id: user_id},{closed: true}]},function(error,data){
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
				data.rental_price = requestBody.rental_price;
				data.save(function(error){
					if(error){
						response.writeHead(500,{'Content-Type':'application/json'});//set response type
						response.data.log = "Error Updating Purchase Fee";//log response
						response.data.success = 0;
						response.end(JSON.stringify(response.data));   
						return;					
					}else{
						response.writeHead(200,{'Content-Type':'application/json'});//set response type
						response.data.log = "Purchase Fee set as "+data.rental_price+" SBD";//log response
						response.data.success = 1;
						response.end(JSON.stringify(response.data));   
						return;    								
					}
				})
				
			}else{
                response.writeHead(200,{'Content-Type':'application/json'});//set response type
                response.data.log = "Book record not found!";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return; 			
			}
		}
	});
}

exports.create_vote = function(requestBody,response){
	response.data = {};

	Vote.findOne({$and: [{permlink: requestBody.permlink},{user_id: requestBody.user_id}]},function(error,data){
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
                response.data.log = "Upvoted";//log response
                response.data.success = 1;
                response.end(JSON.stringify(response.data));   
                return; 				
			}else{
				Vote = toVotes(requestBody);

				Vote.save(function(error){
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
		                response.data.log = "Upvoted";//log response
		                response.data.success = 1;
		                response.end(JSON.stringify(response.data));   
		                return; 	
					}
				});
			}
		}
	})
}
function toBooks(id,data){
	return new Books({
		id: id,
		user_id: data.user_id,
		title: data.title,
		img:  {
			bucket: data.bucket,
			object: data.object
		},
		genre: data.genre,
		synopsis: data.synopsis,
		language: data.language,
		other_language: data.other_language,
		premium: data.premium,
		created: Date.now()		
	});
}

function toChapters(data){
	return new Chapters({
		book_id: data.book_id,
		chapter_title: data.chapter_title,
		steemit_published: data.steemit_published,
		chapter_content: data.chapter_content,
		chapter_number: data.chapter_number,
		author: data.author,
		permlink: data.permlink,
		created: Date.now()	
	})
}

function toChapterRead(book_id, chapter_number, user_id){
	return new Reads({
		book_id: book_id,
		chapter_number: chapter_number,
		user_id: user_id
	})
}

function toVotes(data) {
	return new Vote({
		user_id: {type: String, require: true},
		permlink: {type: String,require: true}		
	});
}