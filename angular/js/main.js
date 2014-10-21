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

	var MainCtrl = function($rootScope, handleData, crud, checkCategory, states){

      	$rootScope.isCreating 		= false;
      	$rootScope.isEditing 		= false;
      	$rootScope.editedBookmark 	= null;
      	$rootScope.categories 		= null;
      	$rootScope.bookmarks  		= null;

	    this.checkCategory		= checkCategory;
		this.crud				= crud;
		this.states 			= states;
		this.handleData 		= handleData;

		// start
		this.handleData.getData(_categoriesService, _bookmarksService);

	};
	
	angular
		.module('myFirstApp')
		.controller('MainCtrl', ['$rootScope', 'handleData', 'crud', 'checkCategory', 'states', MainCtrl]);

})(window, document);


//FACTORIES

/*
 * name: checkCategory
 */

(function(global, doc, undefined){

	'use strict';

	var checkCategory = function($rootScope, states){

		var checkCategory = {};

			$rootScope.currentCategory = null;

			checkCategory.isCurrentCategory = function(category) {
        		return $rootScope.currentCategory !== null && category.name === $rootScope.currentCategory.name;
      		};

      		checkCategory.setCurrentCategory = function(category) {
        		$rootScope.currentCategory = category;

          		states.cancelCreating();
          		states.cancelEditing();
      		};

      	return checkCategory;
	};

	angular
		.module('myFirstApp')
		.factory('checkCategory', ['$rootScope', 'states', checkCategory]);

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

			handleData.getData = function(categoriesUrl, bookmarksUrl){
				$http({method:'GET', url: categoriesUrl})
					.success(function(data){
						$rootScope.categories = data;
					}).then(function(){
						$http({method:'GET', url: bookmarksUrl}).success(function(data){
							$rootScope.bookmarks = data;
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

			crud.resetCreateForm= function() {
		        $rootScope.newBookmark = {
		            title: '',
		            url: '',
		            category: $rootScope.currentCategory.name
		        };
		    };

		    crud.createBookmark = function(newbookmark) {
		        $rootScope.bookmarks.push(newbookmark);

		        if(_mongo){
		        	handleData.postData("add", newbookmark, _bookmarksService);	
		        }
		        
	       		crud.resetCreateForm();

	       		$rootScope.isCreating 	= false;
	    	};
		
			crud.editBookmark = function(thisBookmark){
				var index = _.findIndex($rootScope.bookmarks, function(b){
					return b._id == thisBookmark._id;
				});

				if(_mongo){
					handleData.postData("update", thisBookmark, _bookmarksService);
				}

				$rootScope.bookmarks[index] = thisBookmark;
				$rootScope.editedBookmark	= null;
				$rootScope.isEditing		= false;
			};

			crud.isSelectedBookmark = function(bookmarkId){
				return $rootScope.editedBookmark !== null && $rootScope.editedBookmark._id === bookmarkId;
			};

			crud.deleteBookmark = function(bookmark){
				var _deletedBookmark = _.remove($rootScope.bookmarks, function(b){
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


/*
 * name : states
 */

(function(global, doc, undefined){

	var states = function($rootScope, crud){
		var states = {};

			states.shouldShowCreating = function() {
	      	    return $rootScope.currentCategory && !$rootScope.isEditing;
	      	};

	      	states.startCreating = function() {
	      	    $rootScope.isCreating 	= true;
	      	    $rootScope.isEditing 	= false;
	      	    crud.resetCreateForm();
	      	};

	      	states.cancelCreating = function() {
	      	    $rootScope.isCreating = false;
	      	};

	      	states.shouldShowEditing = function() {
	      	    return $rootScope.isEditing && !$rootScope.isCreating;
	      	};

	      	states.startEditing = function(thisBookmark) {
	      	    $rootScope.isCreating 	= false;
	      	    $rootScope.isEditing 	= true;

	      	    $rootScope.editedBookmark = angular.copy(thisBookmark);
	      	};

	      	states.cancelEditing = function() {
	      	    $rootScope.isEditing 		= false;
	      	    $rootScope.editedBookmark 	= null;
	      	};

	     return states;
	};

	angular
		.module('myFirstApp')
		.factory('states', ['$rootScope', 'crud', states])

})(window, document);