/*
 * NODE SERVEUR GLOBAL SCRIPT
 */ 


// Node requirement : 
var http 		= require('http');
var fs 			= require('fs');
var url 		= require('url');


// Mongo requirement & params : 
var Db 			= require('mongodb').Db;
var MongoClient = require('mongodb').MongoClient;
var ObjectID 	= require('mongodb').ObjectID;


// Methods & gloabl vars :
var _dataBasePath = "mongodb://127.0.0.1:27017/";
var _dataBaseName = "MyProject-1";


var _startCollection = function(){
	var _startCategoriesModel 	= [
		{"name": "Development"},
		{"name": "Design"},
		{"name": "Exercise"},
		{"name": "Humor"}
	];

	var _startBookmarksModel 	= [
		{"title": "AngularJS", "url": "http://angularjs.org", "category": "Development" },
		{"title": "Egghead.io", "url": "http://angularjs.org", "category": "Development" },
		{"title": "A List Apart", "url": "http://alistapart.com/", "category": "Design" },
		{"title": "One Page Love", "url": "http://onepagelove.com/", "category": "Design" },
		{"title": "MobilityWOD", "url": "http://www.mobilitywod.com/", "category": "Exercise" },
		{"title": "Robb Wolf", "url": "http://robbwolf.com/", "category": "Exercise" },
		{"title": "Senor Gif", "url": "http://memebase.cheezburger.com/senorgif", "category": "Humor" },
		{"title": "Wimp", "url": "http://wimp.com", "category": "Humor" },
		{"title": "Dump", "url": "http://dump.com", "category": "Humor" }
	];

	var _createCollection = function(dataBase, name, obj){
		dataBase.createCollection(name, function(err, collection){
			collection.insert(obj, {w: 1}, function(err, records){
				dataBase.createIndex(name, '_id', {unique: true}, function(err, records){});
			});
		});	
	};

	MongoClient.connect('mongodb://127.0.0.1:27017/MyProject-1', function(err, db) {
		if(err){
			throw err;
		}else{

			_dataBase = db;

			// start creating collection in db if doesn't exist : 
			_createCollection(db, 'categories', _startCategoriesModel);
			_createCollection(db, 'bookmarks', _startBookmarksModel);
			
		}
	});
};


// _startCollection();


var _getDataFromDb = function(dataBase, name, response){
	// open mongo client & get data from data base 
	MongoClient.connect(_dataBasePath+_dataBaseName, function(err, db) {

	    // find data in data base (name = collection name);
	    db.collection(name).find({}).toArray(function(err,records){
			if(err){ return false; }
			
			// return the data (encoded) in the response
			var _data = JSON.stringify(records);
			response.writeHead(200, {"Content-Type": "application/json"});
			response.write(_data);
			response.end();

			// close data base
			db.close(function(){
				console.log('_getDataFromDb ', name, ' closed');
			});
		});

	});
};


var _insertDocumentInDb = function(name, doc){
	// open mongo client & get data from data base 
	MongoClient.connect(_dataBasePath+_dataBaseName, function(err, db) {

		console.log('data base open insert : ', name);

	    // get the collection (name = collection name);
		db.collection(name,function(err, collection){
			if(err){ return false; }

			// insert into collection with writting rigth (w:1 in option)
			collection.insert(doc, {w: 1}, function(err, records){
				if(err){ return false; }

				// make sur that the new entry is unique with createIndex
				db.createIndex(name, '_id', function(err, records){
					if(err){console.log(err)}
				});
				
				// close data base
				db.close(function(){
					console.log('_insertDocumentInDb ', name, ' closed');
				});
			});
		});

	});
};


var _updateDocumentInDb = function(name, data){
	// open mongo client & get data from data base
	MongoClient.connect(_dataBasePath+_dataBaseName, function(err, db) {

		console.log('data base open update : ', name);

		var _id 	= ObjectID(data._id);
		var _data 	= {};

		for(var key in data){
			if(key !== '_id'){
				_data[key] = data[key];
			}
		} 

	   	db.collection(name,function(err, collection){
			collection.update({'_id' : _id}, _data, function(err, records){
				//db.createIndex(name, '_id', function(err, records){});

			    if(err){ console.log(err) }

			    // close data base
				db.close(function(){
					console.log('_updateDocumentInDb ', name, ' closed');
				});
			});
		});
	});
};

var _deleteDocumentInDb = function(name, doc){
	// open mongo client & get data from data base
	MongoClient.connect(_dataBasePath+_dataBaseName, function(err, db) {

		db.collection(name,function(err, collection){
			collection.remove({'_id':ObjectID(doc._id)}, function(err, object) {
			    if(err){ console.log(err) };

			    // close data base
				db.close(function(){
					console.log('_updateDocumentInDb ', name, ' closed');
				});

			});
		});
	});
};

// api :
http.createServer(function(request, response){

	console.log('serveur connecté');

	response.setHeader("Access-Control-Allow-Origin", "*");

    var _path 	= url.parse(request.url).pathname;
	var _method = request.method.toLowerCase();

    if(_path === "/categories"){
    	switch(_method){
    		case "get" :
				_getDataFromDb(_dataBaseName, "categories", response);
    		break;
    		case "post" :

    			response.writeHead(200, {"Content-Type": "application/json"});
				response.write('upadte categories isn\'t possible for now');
        		response.end();

    		break;
    	}
    }else
    if(_path === "/bookmarks"){

    	switch(_method){
    		case "get" :
				_getDataFromDb(_dataBaseName, "bookmarks", response);
    		break;
    		case "post" :

				var _dataBody = '';

				// get the data from the request (posted by user) by listening 'data' event on request
				request.on('data', function(data){
					_dataBody += data.toString('utf8');
					_dataBody = JSON.parse(_dataBody);
				});

				// wait the end of the request to work on the data and send the response to the user 
				request.on('end', function(){

					if(_dataBody.type === "add"){
						console.log(_dataBody.data);
						_insertDocumentInDb("bookmarks", _dataBody.data);
					}else
					if(_dataBody.type === "update"){
						console.log(_dataBody.data);
						_updateDocumentInDb("bookmarks", _dataBody.data);
					}else
					if(_dataBody.type === "delete"){
						console.log(typeof(_dataBody.data));
						_deleteDocumentInDb("bookmarks", _dataBody.data);
					}

					response.writeHead(200, {"Content-Type": "application/json"});
        			response.end();
				});

    		break;
    	}
    }
	else{
	    fs.readFile('./index.html', function(err, file) { 
	        if(err){ return false; }
	        response.writeHead(200, { 'Content-Type': 'text/html' }); 
	        response.write(file, "utf-8");
	        response.end();
	    });
	}

}).listen(8001);