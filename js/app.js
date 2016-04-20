(function() {
  'use strict';

    function SlackCtrl($scope, slackSvc) {

        var clientId = "18851227428.35732291009";
        var clientSecret = "be753b4edbcbe82389519e6ddb4f240c";
        var vm = this;
        var config = {
            client: clientId,
            authParams : {
                team : "nxtchat",
                state : NRS.accountRS,
                redirect_uri : "http://localhost:7876/plugins/slackchat/html/pages/return.html",
                scope : "identify channels:read files:read channels:write"
            }
        };

        vm.messages = [
            {
                'username': 'Welcome Bot',
                'content': 'Logging you into slack'
            }
        ];

        vm.onmessage = function(message){
            vm.messages.push({
                'username' : message.user,
                'content' : message.text
            });
        };
        vm.sendMessage = function(message, username) {
            if(message && message !== '' && username) {
                vm.messages.push({
                    'username': username,
                    'content': message
                });
                slackSvc.chat.postMessage($scope,$scope.channelId,message,$scope.token);
            }
        };

        vm.onRTMStart = function(msg){
            var url = msg.url;
            $scope.socket = new WebSocket(url);
            $scope.socket.onopen = function(event){
                if(!event.error) {
                    vm.messages.push({'username': 'Welcome Bot', 'content': 'Successfully logged in'});
                }else{
                    console.error("Error connecting: ",event);
                }
            };

            $scope.socket.onmessage = function(msg){
                var data = JSON.parse(msg);
                if(data.type == "message"){
                    vm.messages.push({'username': data.user, 'content': data.text});
                }else{
                    console.warn("Unhandled Message Type: ",data);
                }
            }
        };

        var token = localStorage.getItem("slack.token");
        if(!token){
            slackSvc.authorize(config.client,config.authParams);
        }else{
            console.log("Authing: ",NRS.accountRS);
            slackSvc.oauth.access(clientId, clientSecret,token , function (response) {
                if(response.ok){
                    //optional : preload you token for further requests
                    slackSvc.InitToken(response.access_token);
                    slackSvc.rtm.start(response.access_token,vm.onRTMStart);
                }else{
                    console.log("Error in slack auth: ",response);
                }
            });
        }

    }
    angular.module('slackChatApp', [
        'Deg.SlackApi',
        'valortech.slackChat'
    ]).controller('SlackCtrl', ['$scope', 'slackSvc',SlackCtrl]);

})();
