(function() {
  'use strict';

    function SlackCtrl($scope, ngToast, slackSvc) {

        var clientId = "18851227428.35732291009";
        var clientSecret = "be753b4edbcbe82389519e6ddb4f240c";
        var vm = this;
        var config = {
            client: clientId,
            authParams : {
                team : "nxtchat",
                state : NRS.accountRS,
                redirect_uri : "http://localhost:7876/plugins/slackchat/html/pages/return.html",
                scope : "identify read post client"
            }
        };

        vm.messages = [
            {
                'username': 'Welcome Bot',
                'content': 'Logging you into slack'
            }
        ];

        function onPostMessageResultCB(result){
            console.log("Result: ",result);
        }
        vm.onmessage = function(message){
            vm.messages.push({
                'username' : message.user,
                'content' : message.text
            });
        };
        $scope.getChannelIdByName = function(name){
            for(let chan of $scope.channels){
                if(chan.name == name){
                    return chan.id;
                }
            }
        };
        vm.sendMessage = function(message,username) {
            console.log("sending: ",message);
            if(message) {
                if(!$scope.channelId){
                    $scope.channelId = $scope.getChannelIdByName("general");
                }
                console.log("Channel is ",$scope.channelId);
                slackSvc.chat.postMessage($scope.channelId,message,onPostMessageResultCB,$scope.access_token);
            }
        };

        $scope.userById = function(id){
            for(var user of $scope.users){
                if(user.id == id){
                    return user;
                }
            }
            return null;
        };
        vm.onRTMStart = function(msg){
            console.log("onRTMStart.msg: ",msg);
            var url = msg.url;
            $scope.users = msg.users;
            $scope.$applyAsync(function() {
                $scope.channels = msg.channels;

                $scope.socket = new WebSocket(url);
                $scope.socket.onopen = function(event){
                    console.log("onopen.event: ",event);
                    if(!event.error) {
                        vm.messages.push({'username': 'Welcome Bot', 'content': 'Connecting...'});
                        $scope.channelId = $scope.getChannelIdByName("general");
                    }else{
                        console.error("Error connecting: ",event);
                    }
                };

                $scope.socket.onmessage = function(event){
                    var data = JSON.parse(event.data);
                    console.log("onmessage.event: ",data);

                    var msg = {};
                    if(data.user){
                        var user = $scope.userById(data.user);
                        if(user) {
                            msg.username = user.name;
                        }else{
                            msg.username = data.user;
                        }
                    }
                    if(data.channel){
                        $scope.channelId = data.channel;
                    }
                    switch(data.type){
                        case "hello" :
                            msg.content= "Connected";
                            break;
                        case "presence_change" :
                            if(data.presence == "active"){
                                msg.content = "Joined"
                            }else{
                                msg.content = "Left"
                            }
                            $scope.$apply(function(){
                                console.log("Toasting: ",msg);
                                ngToast.info(msg.username+": "+msg.content);
                                console.log("toast: ",ngToast);
                            });
                            return;
                            break;
                        case "message" :
                            msg.content = data.text;
                            break;

                        default:
                            console.warn("Unhandled Message Type: ",data);
                            break;

                    }
                    if(msg.username && msg.content){
                        $scope.$apply(function(){
                            console.log("Adding: ",msg);
                            //var msgs = vm.messages;
                            //msgs.push(msg);
                            ngToast.create(msg.username+": "+msg.content);
                            vm.messages.push(msg);
                            console.log("There are "+vm.messages.length+" messages");
                            if(vm.messages.length > 20){
                                vm.messages = vm.messages.slice(-20);
                            }
                        });

                    }
                }

            });

        };

        //localStorage.removeItem("slack.access_token");
        //localStorage.removeItem("slack.temp_token");
        var access_token = localStorage.getItem("slack.access_token");
        var temp_token = localStorage.getItem("slack.temp_token");

        if(temp_token){
            slackSvc.oauth.access(clientId, clientSecret,temp_token, function (response) {
                if(response.ok){
                    //optional : preload you token for further requests
                    localStorage.setItem("slack.access_token", response.access_token);
                    access_token = response.access_token;
                }else{
                    console.log("Error in slack auth: ",response);
                }
                localStorage.removeItem("slack.temp_token");
                console.log("Authing: ", NRS.accountRS);
                $scope.access_token = access_token;
                slackSvc.InitToken(access_token);
                slackSvc.rtm.start(access_token, vm.onRTMStart);
            });
        }else {
            if (access_token) {
                $scope.access_token = access_token;
                console.log("Authing: ", NRS.accountRS);
                slackSvc.InitToken(access_token);
                slackSvc.rtm.start(access_token, vm.onRTMStart);
            } else if (!access_token && !temp_token) {
                slackSvc.authorize(config.client, config.authParams);
            }
        }
    }
    var app = angular.module('slackChatApp', [
        'Deg.SlackApi',
        'valortech.slackChat',
        'ngToast'
    ]).controller('SlackCtrl', ['$scope', 'ngToast','slackSvc',SlackCtrl]);
    app.config(['ngToastProvider', function(ngToastProvider) {
        ngToastProvider.configure({
            animation: 'slide' // or 'fade'
        });
    }]);
})();
