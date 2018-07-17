var mongoose = require('mongoose'),
	shortid = require('shortid');
	
var subscriptionsSchema = new mongoose.Schema({
	id: {type: String, unique: true, require: true, 'default': shortid.generate},
	user_id: {type: String, require: true},
	start: {type: Date, require: true},
	end: {type: Date, require: true},
	created: {type: Date, require: true, 'default': Date.now}
});

var Subscriptions = mongoose.model('subscriptions',subscriptionsSchema);

var exports = module.exports;

exports.subscriptions_model = Subscriptions;

exports.check_validity = function(user_id,callback){
	
	callback(true);
	/**Subscriptions.findOne({$and: [{user_id: user_id},{end: {$gt: new Date()}}]},function(error,data){
		if(error){
			console.log(error);
			callback(false);
		}else{
			if(data && Object.keys(data)>0){
				console.log(data);
			}else{
				callback(false);
			}
		}
	})**/
}

exports.create_callback = function(user_id,end,start,callback){
	
	var Subscription = toSubscriptions(user_id,end,start);
	
	Subscription.save(function(error){
		if(error){
			callback(false);
		}else{
			callback(true);
		}
	});
}

exports.create_subscription = function(user_id,response){

	var start = new Date(),
		end = new Date(new Date + (24*3800*1000*30));
	
	response.data = {};
		
	var Subscription = toSubscriptions(user_id,end,start);
	
	Subscription.save(function(error){
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
			response.data.log = "Subscription renewed for 30 days";//log response
			response.data.success = 1;
			response.end(JSON.stringify(response.data));   
			return;       			
		}
	});
}

function toSubscriptions(user_id,end,start){
	return new Subscriptions({
		user_id: user_id,
		start: start,
		end: end
	})
}