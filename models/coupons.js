var  mongoose = require("mongoose"),
	Users = require('./users'),
	shortid = require('shortid');

var couponsSchema = new mongoose.Schema({
	id: {type: String, unique: true, require: true, 'default':shortid.generate},
	user_id: {type: String},
	book_id: {type: String, require: true},
	uses_left: {type: Number, require: true},
	percentage_off: {type: String,require: true}
});

var Coupons = mongoose.model('Coupons',couponsSchema);

var exports = module.exports;

exports.CouponsModel = Coupons;

exports.create_coupon = function(requestBody,response){
	response.data = {};

	Users.UsersModel.findOne({steemit_username: requestBody.steemit_username},function(error,data){
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
				var user_id = data.id;
				saveCoupon(user_id,requestBody,response);
			
			}else{
				var user_id = undefined;
				saveCoupon(user_id,requestBody,response);
			}
		}
	})
}

exports.use_coupon = function(requestBody,callback){
	Coupons.findOne({$and: [{id:requestBody.coupon_id},{book_id: requestBody.book_id},{user_id: requestBody.user_id}]},function(error,data){
		if(error){
			console.log(error);
			callback(false);              			
		}else{
			if(data){
				data.uses_left = parseInt(data.uses_left)-1;

				data.save(function(error){
					if(error){
						console.log(error);
						callback(false);
					}else{
						Coupons.remove({uses_left: 0},function(error){
							if(error){
								console.log(error);
								callback(true);
							}else{
								callback(true);
							}
						})
					}
				})
			}else{
				callback(false); 				
			}
		}
	})
}

function saveCoupon(user_id,data,response){
	Coupons.findOne({and: [{user_id: user_id},{book_id:data.book_id}]},function(error,data){
		console.log(error);
		if(data && Object.keys(data).length>0){
		    response.writeHead(200,{'Content-Type':'application/json'});//set response type
		    response.data.log = "Valid coupon still exists";//log response
		    response.data.success = 0;
		    response.end(JSON.stringify(response.data));   
		    return;   
		}else{
			var Coupon = toCoupon(user_id,data);

			Coupon.save(function(error){
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
		                console.log(error);
		                response.writeHead(200,{'Content-Type':'application/json'});//set response type
		                response.data.log = "Coupon Saved!";//log response
		                response.data.success = 1;
		                response.end(JSON.stringify(response.data));   
		                return;           	
		        }
			});
		}

	});

}

function toCoupon(user_id,data){
	return new Coupon({
		user_id: user_id,
		book_id: data.book_id,
		uses_left: data.uses_left,
		percentage_off: data.percentage_off
	})
}

