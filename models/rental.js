/**Now Purchases... Needs Refactoring**/

var mongoose = require('mongoose'),
	shortid = require('shortid'),
	moment = require('moment'),
	Coupons = require('./coupons'),
	Steem = require('steem');

	
var bookRentalSchema = new mongoose.Schema({
	id: {type: String, unique: true, require: true, 'default': shortid.generate},
	book_id: {type: String, require: true},
	steemit_user_name: {type: String,require: true},
	user_id: {type: String, require: true},
	claim_user_id: {type: String, require: true},
	paid: {type: Boolean, require: true},
	price: {type: Number, require: true},
	timestamp: {type: Date, 'default': Date.now},
	expiry: {type: Date, require: true}
});

var BookRental = mongoose.model('book_rental',bookRentalSchema);

var exports = module.exports;

exports.create_rental = function(requestBody,response){
	var user_id = requestBody.user_id,
		book_id = requestBody.book_id;
	
	response.data = {};
	
	BookRental.findOne({$and: [{user_id: user_id},{book_id: book_id}]},function(error,data){
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
				response.data.log = "Book Already purchased";//log response
				response.data.success = 0;
				response.end(JSON.stringify(response.data));   
				return; 				
			}else{
			
				var expiry = moment().add('days',30);
				var Rental = toRental(requestBody,expiry);
				
				Rental.save(function(error){
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
						response.data.log = "Purchase Successful";//log response
						response.data.success = 1;
						response.end(JSON.stringify(response.data));   
						return; 						
					}
				});
				
			}
		}
	})
	
}

exports.fetch_rentals = function(requestBody,response){
	var user_id = requestBody.user_id;
	
	response.data = {};
	
	var aggregate = [{
		$match: {$and: [{user_id: user_id}]}
	},{
		$lookup: {
			from:'books',
			foreignField: 'id',
			localField: 'book_id',
			as: "book_data"
		}
	},{
		$lookup: {
			from: 'reviews',
			foreignField: 'book_id',
			localField: 'book_id',
			as: 'reviews_data'
		}
	},{
		$lookup: {
			from: "chapters",
			foreignField: "book_id",
			localField: "book_id",
			as: "chapter_data"
		}
	},{
		$project: {
			book_data: 1,
			rating_num: {$size: '$reviews_data'},
			rating: {$avg: '$reviews_data.rating'}, 			
			chapter_num: {$size: '$chapter_data'},			
			expiry: 1
		}
	}]
	
	BookRental.aggregate(aggregate,function(error,data){
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
				response.data.log = "No Purchases";//log response
				response.data.success = 0;
				response.end(JSON.stringify(response.data));   
				return; 									
			}
		}
	});
}

exports.fetch_user_claims = function(requestBody,response){
	var user_id = requestBody.user_id;
	
	response.data = {};
	
	var aggregate = [{
		$match: {$and: [{claim_user_id: user_id},{paid: false}]}
	},{
		$lookup: {
			from:'books',
			foreignField: 'id',
			localField: 'book_id',
			as: "book_data"
		}
	}]
	
	BookRental.aggregate(aggregate,function(error,data){
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
				response.data.log = "No Recent Purchases";//log response
				response.data.success = 0;
				response.end(JSON.stringify(response.data));   
				return; 									
			}
		}
	});
}

exports.claim_rewards = function(requestBody,response){
		response.data = {};
		BookRental.findOne({$and: [{claim_user_id: requestBody.user_id},{id: requestBody.claim_id},{paid: false}]},function(error,data){
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

					var amount1 = (0.75 * parseFloat(data.price)).toFixed(3) +" SBD";
					var amount2 = (0.25 * parseFloat(data.price)).toFixed(3) +" SBD";

					Steem.broadcast.transfer(process.env.ACTIVE_KEY,'dbooks.pay',requestBody.claim_acct, amount1,"DBooks: Earnings from Book Purchase",function(err,result){
						if(err){
							console.log(err);
							response.writeHead(500,{'Content-Type':'application/json'});//set response type
							response.data.log = "Steem Error 1";//log response
							response.data.success = 0;
							response.end(JSON.stringify(response.data));   
							return; 									
						}else{
							if(result){
								if((0.25 * parseFloat(data.price)).toFixed(3)>=0.001){
									Steem.broadcast.transfer(process.env.ACTIVE_KEY,'dbooks.pay','dbooks.org',amount2,"Book Purchase transcation fee",function(err,result){
										if(err){
											console.log(err);
											response.writeHead(500,{'Content-Type':'application/json'});//set response typed
											response.data.log = "Steem Error 2";//log response
											response.data.success = 0;
											response.end(JSON.stringify(response.data));   
											return; 										
										}else{
											if(result){
												data.paid = true;

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
														response.data.log = "Claim Successful";//log response
														response.data.success = 1;
														response.end(JSON.stringify(response.data));   
														return;								
													}
												})
											}else{
												response.writeHead(200,{'Content-Type':'application/json'});//set response type
												response.data.log = "Something went wrong 1";//log response
												response.data.success = 0;
												response.end(JSON.stringify(response.data));   
												return; 
											}
										}
									})
								}else{
									data.paid = true;

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
											response.data.log = "Claim Successful";//log response
											response.data.success = 1;
											response.end(JSON.stringify(response.data));   
											return;								
										}
									});									
								}
							}else{
								response.writeHead(200,{'Content-Type':'application/json'});//set response type
								response.data.log = "Something went wrong 2";//log response
								response.data.success = 0;
								response.end(JSON.stringify(response.data));   
								return; 
							}
						}
					});
					
				}else{
					response.writeHead(200,{'Content-Type':'application/json'});//set response type
					response.data.log = "Invalid Claim";//log response
					response.data.success = 0;
					response.end(JSON.stringify(response.data));   
					return; 
				}
			}
		})
}

exports.validate_rental = function(user_id,book_id,callback){
	BookRental.findOne({$and: [{user_id: user_id},{book_id: book_id}]},function(error,data){
		if(error){
			callback(false);					
		}else{
			if(data && Object.keys(data).length>0){
				callback(true);			
			}else{
				callback(false);									
			}
		}
	});	
}

function toRental(data,expiry){
	return new BookRental({
		book_id: data.book_id,
		steemit_user_name: data.steemit_user_name,
		user_id: data.user_id,
		claim_user_id: data.claim_user_id,
		paid: false,
		price: data.price,
		expiry: expiry
	})
}
