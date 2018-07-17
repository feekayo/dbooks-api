var Users = require('../models/users'),
	url = require('url');//url parser is require
	
module.exports = {
	index: function(request,response) { //index link
        response.send("Welcome to DBooks API"); //show welcome message
    }	
}