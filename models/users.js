var mongoose = require("mongoose"),
	shortid = require("shortid"),
	Subscriptions = require("./subscriptions");
	
var  usersSchema = new mongoose.Schema({
	id: {type: String, unique: true, require: true},
	steemit_username: {type: String, unique: true},
	password: {type: String},
	pen_name: {type: String},
	last_update: {type: Date,'default':Date.now},
	created: {type: Date}
});

var Users = mongoose.model('users',usersSchema);

var sessionsSchema = new mongoose.Schema({
    id: {type: String, unique: true, 'default': shortid.generate},
    session_id: String,
    user_id : String,
    created : {type: Date, 'default': Date.now}
});

var Sessions = mongoose.model('Sessions',sessionsSchema);

var exports = module.exports;

exports.UsersModel = Users

exports.create_steemit_user = function(requestBody,response){
	
	response.data = {};
	
	var steemit_username = requestBody.steemit_username;
	
	Users.findOne({steemit_username: steemit_username},function(error,data){
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
				var session_id = shortid.generate();
				var Session = toSession(session_id,data.id);

				Session.save(function(error){//log in as steemit user
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
						response.data.log = "Logged in successfully";//log response
						response.data.session_id = session_id;
						response.data.user_id = data.id;
						response.data.pen_name = data.pen_name;
						response.data.success = 1;
						response.data.validity = validity;
						response.end(JSON.stringify(response.data));   
						return;  							
					}
				});     			
			}else{
				//create new steemit user
				
				var user_id = shortid.generate();
				var SteemitUser = toSteemitUsers(user_id,requestBody);
				
				SteemitUser.save(function(error){
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
						var session_id = shortid.generate();
						
						var Session = toSession(session_id,user_id);

						Session.save(function(error){//log in as steemit user
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
							
								var start = new Date(),
									end = new Date(+new Date + 12096e5);
								Subscriptions.create_callback(user_id,end,start,function(subscribed){
													
									if(subscribed){
										response.writeHead(200,{'Content-Type':'application/json'});//set response type
										response.data.log = "Welcome to DBooks!";//log response
										response.data.session_id = session_id;
										response.data.user_id = user_id;
										response.data.pen_name = "";
										response.data.success = 1;
										response.data.validity = end;
										response.end(JSON.stringify(response.data));   
										return;										
									}else{
										response.writeHead(200,{'Content-Type':'application/json'});//set response type
										response.data.log = "Account Created";//log response
										response.data.session_id = session_id;
										response.data.user_id = user_id;
										response.data.pen_name = "";
										response.data.success = 1;
										response.data.validity = false;
										response.end(JSON.stringify(response.data));   
										return;										
									}
															
								})							
							}
						}); 						
					}
				})
			}
		}
	});
}

exports.validate_session = function(user_id,session_id,callback){
	//validate user
	Sessions.findOne({$and: [{user_id: user_id},{session_id: session_id}]},function(error,data){
		console.log(user_id+" "+session_id);
		if(error){
			callback(false);
		}else{
			if(data){
				callback(true);
			}else{
				callback(false)
			}
		}
	});
}

exports.update_pen_name = function(requestBody,response){
	response.data = {};

	Users.findOne({id: requestBody.user_id},function(error,data){
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
				data.pen_name = requestBody.pen_name;

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
			            response.data.log = "Pen Name Updated";//log response
			            response.data.success = 1;
			            response.end(JSON.stringify(response.data));   
			            return;      						
					}
				})
			}else{
                response.writeHead(200,{'Content-Type':'application/json'});//set response type
                response.data.log = "User not found!";//log response
                response.data.success = 0;
                response.end(JSON.stringify(response.data));   
                return;   
			}
		}
	})
}

exports.logout = function(user_id,session_id,response){
	
	response.data = {};

	Sessions.remove({$and: [{user_id: user_id},{session_id: session_id}]},function(error){
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
            response.data.log = "Logged Out";//log response
            response.data.success = 1;
            response.end(JSON.stringify(response.data));   
            return;   			
		}
	});
}

function toSteemitUsers(user_id,data){
	return new Users({
		id: user_id,
		steemit_username: data.steemit_username,
		created: Date.now()
	});
}


function toSession(session_id,user_id){
	return new Sessions({
		user_id: user_id,
		session_id: session_id
	})
}