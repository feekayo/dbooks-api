var express = require('express'),
    router = express.Router(),
    //url = require('url'), //download url module
    accounts =require('../controllers/accounts'),//define controllers
    create = require('../controllers/create'),
    read = require('../controllers/read');
    update = require('../controllers/update'),
    remove = require('../controllers/delete');

module.exports = function(app){
    
    //accounts routes
    router.get('/',accounts.index);//hello message
	
    app.use(router);
}