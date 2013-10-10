angular.module('myApp', ['myApp.controllers', 'myApp.directives']);

angular.module('myApp.controllers', []).controller('ctrl', ['$scope', function($scope){

	var socket = io.connect();

	socket.on('message', function (data) {
		if(data.message) {
			$scope.localLog = data.message;
			$scope.$apply();
		}
	});

	socket.on('log', function (data) {
		if(data.message) {
			$scope.localLog = data.message;
			$scope.$apply();
		}
	});

	$scope.postPicture = function(picUrl){
		socket.emit('send', { message: picUrl });
	}

}]);

angular.module('myApp.directives', []).directive('screen', function(){

	return {
		restrict: 'A',
		scope: {
			sendPicture: '&',
			log:'@'
		},
		template: '<canvas id="viz" ng-mousedown="clicking = true" ng-mouseup="clicking = false;" ng-mouseleave="clicking = false;"></canvas>' + 
			'<br/><button ng-click="erase()">erase</button>',
		link: function(scope, element, attrs){

			scope.canvas = document.getElementById('viz');
			scope.context = scope.canvas.getContext('2d');
			scope.canvas.width = scope.canvas.height = 400;

			scope.clicking = false;
			scope.lastEvent = {};

			var img = new Image();
			img.onload = function(){
			  scope.context.drawImage(img,0,0,scope.canvas.width,scope.canvas.height);
			};

			scope.pencil = function(event){
				if(scope.clicking){
					scope.context.beginPath();
					scope.context.moveTo(event.offsetX, event.offsetY);
					scope.context.lineTo(scope.lastEvent.offsetX, scope.lastEvent.offsetY);
					scope.context.closePath();
					scope.context.strokeStyle = 'black';
					scope.context.stroke();
					scope.sendPicture({
					message:{
						oldX: scope.lastEvent.offsetX,
						oldY: scope.lastEvent.offsetY,
						newX: event.offsetX,
						newY: event.offsetY
					}
				});
				}
				
				scope.lastEvent = event;
			};

			scope.erase = function(){
				scope.sendPicture({message:{erase:true}});
			};

			scope.$watch('log', function(newVal){
				if(newVal !== undefined && newVal.length > 6){
					var messageJson = angular.fromJson(newVal);
					if(messageJson.erase !== undefined){
						scope.context.clearRect(0,0,scope.canvas.width, scope.canvas.height);
						return;
					}
					scope.context.beginPath();
					scope.context.moveTo(messageJson.oldX, messageJson.oldY);
					scope.context.lineTo(messageJson.newX, messageJson.newY);
					scope.context.closePath();
					scope.context.strokeStyle = 'black';
					scope.context.stroke();
				}

			});

			element.bind('mousemove', function(event){
				scope.pencil(event);
			});


		}
	};
});