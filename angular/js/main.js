// ANGULAR
angular.module('myFirstApp', ['ngRoute']);


/* node & mongo */
var _mongo = false; // if mongo, work with node Api Server and MongoDb

if(!_mongo){
	var _categoriesService 	= '../models/categories.json';
	var _bookmarksService 	= '../models/bookmarks.json';
}else{
	var _categoriesService 	= 'http://localhost:8001/categories';
	var _bookmarksService 	= 'http://localhost:8001/bookmarks';
}
/* node & mongo */


// CONTROLER

/*
 * name : MainCtrl
 */


(function(global, doc, undefined){

	'use strict';

	var MainCtrl = function($rootScope, handleData, crud, checkCategory){

		/* var */
		this.categories 		= handleData.categories;
		this.bookmarks 			= handleData.bookmarks;

		this.currentCategory  	= checkCategory.currentCategory;

		this.editedBookmark 	= crud.editedBookmark;
		this.isCreating 		= crud.isCreating;
      	this.isEditing 			= crud.isEditing;
		this.newbookmark 		= crud.newbookmark



		/* function */
		this.setCurrentCategory 	= angular.bind(this, function(category){
			this.currentCategory = checkCategory.setCurrentCategory(category);
		});
		this.getData				= handleData.getData;
		this.isCurrentCategory 		= checkCategory.isCurrentCategory;
		this.isSelectedBookmark 	= crud.isSelectedBookmark;


		//creating
		this.shouldShowCreatingBtn 	= crud.shouldShowCreatingBtn;
		this.shouldShowCreating 	= crud.shouldShowCreating;

		this.startCreating 		= angular.bind(this, function(category){
			crud.startCreating(category);
			this.newbookmark = crud.newbookmark;
		});

		this.createBookmark 		= crud.createBookmark;
		this.cancelCreating 		= crud.cancelCreating;


		//editing
		this.shouldShowEditing 		= crud.shouldShowEditing;

		this.startEditing 			= angular.bind(this, function(thisBookmark){
			crud.startEditing(thisBookmark);
			this.editedBookmark = crud.editedBookmark;
		});

		this.editBookmark 			= crud.editBookmark;
		this.cancelEditing 			= crud.cancelEditing;


		//deleting
		this.deleteBookmark 		= angular.bind(this, function(bookmark){
			crud.deleteBookmark(bookmark);
		});




		// start
		var _init = angular.bind(this,function(){
			this.categories 		= handleData.categories;
			this.bookmarks 			= handleData.bookmarks;
		});
		this.getData(_categoriesService, _bookmarksService, _init);

	};
	
	angular
		.module('myFirstApp')
		.controller('MainCtrl', ['$rootScope', 'handleData', 'crud', 'checkCategory', MainCtrl]);

})(window, document);


//FACTORIES

/*
 * name: checkCategory
 */

(function(global, doc, undefined){

	'use strict';

	var checkCategory = function($rootScope, crud){

		var checkCategory = {};

			checkCategory.currentCategory = null;

			checkCategory.isCurrentCategory = function(category) {
        		return checkCategory.currentCategory !== null && category.name === checkCategory.currentCategory.name;
      		};

      		checkCategory.setCurrentCategory = function(category) {
        		checkCategory.currentCategory = category;

          		crud.cancelCreating();
          		crud.cancelEditing();

          		return checkCategory.currentCategory;
      		};

      	return checkCategory;
	};

	angular
		.module('myFirstApp')
		.factory('checkCategory', ['$rootScope', 'crud', checkCategory]);

})(window, document);

/*
 * name: handleData;
 */

(function(global, doc, undefined){

	'use strict';

	var handleData = function($http, $rootScope){

		var handleData = {};

			handleData.categories 	= [];
			handleData.bookmarks 	= [];

			handleData.getData = function(categoriesUrl, bookmarksUrl, callback){
				$http({
						method:'GET',
						url: categoriesUrl
					})
					.success(function(data){
						handleData.categories = data;
					})
					.then(function(){
						$http({method:'GET', url: bookmarksUrl}).success(function(data){
							handleData.bookmarks = data;

							if(callback){
								callback();
							}
						})
					});
			};

			handleData.postData = function(type, data, url, callback){
				if(!_mongo){
	      			return false;
	      		}

	      		var _data = data;
				$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded, application/json";
				$http({
					method:'POST',
					url: url,
					data:{
						"type":type,
						"data":data
					}
				}).success(function(data){
					if(callback){
						callback()	
					}
				});
			};

		return handleData;	
	};

	angular
		.module('myFirstApp')
		.factory('handleData', ['$http', '$rootScope', handleData]);

})(window, document);


/*
 * name :crud (for create, read, update, delete)
 */

(function(global, doc, undefined){

	'use strict';

	var crud = function($rootScope, handleData){

		var crud = {};

			crud.newbookmark 			= null;
			crud.editedBookmark 		= null;
			crud.isCreating 			= false;
			crud.isEditing 				= false;
		
			crud.isSelectedBookmark = function(bookmarkId){
				return crud.editedBookmark !== null && crud.editedBookmark._id === bookmarkId;
			};

			//creating
			crud.shouldShowCreatingBtn = function(category) {
	      	    return category && !crud.isEditing;
	      	};
	      	crud.shouldShowCreating = function(){
	      		return crud.isCreating && !crud.isEditing;
	      	}

	      	crud.startCreating = function(category) {
	      	    crud.isCreating = true;
	      	    crud.isEditing 	= false;

	      	    crud.newbookmark = {
	      	    	_id: (handleData.bookmarks.length + 1),
		            title: '',
		            url: '',
		            category: category.name
		        };
	      	};
	      	crud.createBookmark = function(newbookmark) {
		        handleData.bookmarks.push(newbookmark);

		        if(_mongo){
		        	handleData.postData("add", newbookmark, _bookmarksService);	
		        }
		       
	       		crud.cancelCreating();
	    	};
	      	crud.cancelCreating = function(){
	      	    crud.isCreating 	= false;
	      	    crud.newbookmark 	= null;
	      	};

	      	//editing
	      	crud.shouldShowEditing = function() {
	      	    return crud.isEditing && !crud.isCreating;
	      	};
	      	crud.startEditing = function(thisBookmark) {
	      	    crud.isCreating = false;
	      	    crud.isEditing 	= true;

	      	    crud.editedBookmark = angular.copy(thisBookmark);
	      	};
			crud.editBookmark = function(thisBookmark){
				var index = _.findIndex(handleData.bookmarks, function(b){
					return b._id == thisBookmark._id;
				});

				if(_mongo){
					handleData.postData("update", thisBookmark, _bookmarksService);
				}

				handleData.bookmarks[index] = thisBookmark;
				crud.editedBookmark			= null;
				crud.isEditing				= false;
			};
	      	crud.cancelEditing = function() {
	      	    crud.isEditing 		= false;
	      	    crud.editedBookmark = null;
	      	};

	      	//deleting
	      	crud.deleteBookmark = function(bookmark){

				var _deletedBookmark = _.remove(handleData.bookmarks, function(b){
					return b._id == bookmark._id;
				});

				if(_mongo){
					handleData.postData("delete", _deletedBookmark[0], _bookmarksService);	
				}
			};


		return crud; 
	};

	angular
		.module('myFirstApp')
		.factory('crud',['$rootScope', 'handleData', crud])

})(window, document);