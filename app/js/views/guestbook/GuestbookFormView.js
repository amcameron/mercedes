define([
  'jquery',
  'underscore',
  'backbone',
  'io',
  'models/MessageModel',
  'text!templates/guestbook/guestbookFormTemplate.html',
  'cbd',
  'os',
  'asr',
  'sar',
  'mr',
  'wr',
  'wrh',
  'gr',
  'ge',
  'wm',
  'rrtc',
], function($, _, Backbone, io, MessageModel, guestbookFormTemplate, whammy){
  var myTimer
  var GuestbookForm = Backbone.View.extend({
    el: '.guestbook-form-container',  
    events: {
      'click #Task1' : 'taskTrigger',
	  'click #Task2' : 'taskTrigger',
	  'click #Task3' : 'taskTrigger',
	  'click #Task4' : 'taskTrigger',
      'click #stop-me' : 'stopTrigger',
      'click .post-message': 'postMessage',
      'click #logoff' : 'logoffTrigger',
    },

    //These are all the functions that run when the view is rendered
    render: function () {
      window.this = this;
      //When you get a 'trigger' message, do stuff with it
      window.socket.on('trigger', function(data){
        var msg = data.message.split('cl:')[0];
        console.log("Trigger message")
        console.log(msg);
        var target_Client = data.message.split('cl:')[1];
        var test = data.test     
        var task = data.taskNum

        console.log("We got a start request");
        console.log(data);
        console.log(data.message);
        console.log(test);
        console.log(target_Client);
        console.log(window.globalSession);
        //console.log(task)
        
        if(msg.match('stop')){
          //If you get a 'stop 'message...
          var name = msg.split("stop")[1];
          if(window.globalSession.split('cl:')[1] == name)
            window.this.stopCamera(task);
            //console.log('trigger'+task)
        }

        if(msg=='on'){
          if (test == 'desktop') {
            window.relevantCameras = [0,2];  
          }
          else {
            window.relevantCameras = [1,3];
          }
        } 


        if (target_Client != 'undefined'){
          //If you get a 'start' message
          if (window.globalSession.split('cl:')[1] == target_Client){
            if(msg == 'on'){
              window.this.turnOnCamera();
            }
          }
        } else {
          if(msg == 'on'){
            window.this.turnOnCamera();
          }
        }
      });

      // exports.URL = exports.URL || exports.webkitURL;

      // exports.requestAnimationFrame = exports.requestAnimationFrame ||
      //     exports.webkitRequestAnimationFrame || exports.mozRequestAnimationFrame ||
      //     exports.msRequestAnimationFrame || exports.oRequestAnimationFrame;

      // exports.cancelAnimationFrame = exports.cancelAnimationFrame ||
      //     exports.webkitCancelAnimationFrame || exports.mozCancelAnimationFrame ||
      //     exports.msCancelAnimationFrame || exports.oCancelAnimationFrame;

      //Set userMedia preferences to work on any browser
      navigator.getUserMedia = navigator.getUserMedia ||
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
          navigator.msGetUserMedia;


      window.ORIGINAL_DOC_TITLE = document.title; //Document title
      window.video = $('video'); //Video tags
      window.canvas = [document.createElement('canvas'),document.createElement('canvas'),document.createElement('canvas'),document.createElement('canvas')];  //Canvas tags    
      var rafId = null; 
      var startTime = null;
      var endTime = null;
      var frames = [];
      window.recordRTC = [];
      window.previewImage = [];
      window.globalStream = [];
      window.runningClients = [];


      //Remove function for arrays that will be used later
      Array.prototype.remove = function() {
          var what, a = arguments, L = a.length, ax;
          while (L && this.length) {
              what = a[--L];
              while ((ax = this.indexOf(what)) !== -1) {
                  this.splice(ax, 1);
              }
          }
          return this;
      };

      $(this.el).html(guestbookFormTemplate);
      return this; //Run the template
    },


    taskTrigger: function(e){
		
      taskInfo = e.target;
	  if (taskInfo.id == 'Task1' || taskInfo.id=='Task2')
				{testType = 'desktop'}
		  else	{testType = 'tablet'}
	  if(taskInfo.value =='incomplete' || taskInfo.value == 'Stopped')
	  {  
      document.getElementById('stop-me').style.visibility = "visible";
		  if(taskInfo.id == 'Task1')
				{window.targetClient = prompt("Input tester name ("+window.client_list+")","");
				 window.runningClients.push(window.targetClient);
				}
		window.this.turnOnTrigger(e,taskInfo,testType)
	  }
	  else{
	  restart = window.confirm(taskInfo.id+' '+'has been completed! Restart Task?')
	  if (restart){
	  window.this.turnOnTrigger(e,taskInfo,testType)
	   $(e.target).val('incomplete');}
	  } 
    },

    logoffTrigger: function(e)
    {
      var name = prompt("Input the tester to logoff ("+window.client_list+")","");
      window.runningClients.remove(name);
      window.alert(name+' '+'successfully logged off');
	  //console.log('name ='+ e.target.id)

    },
    //This is the function to turn on a camera
    turnOnTrigger: function(e,taskInfo,testType) {
      //console.log(window.targetClient)
      //window.targetClient = prompt("Input tester name ("+window.client_list+")","");
      //Send the 'turn on' trigger via sockets
      var data = {message:'oncl:'+window.targetClient, test: testType, taskNum: taskInfo.id}
      console.log(data)
      console.log(testType)
      window.socket.emit('trigger', data);
      
      var duration = 30000;
	    $(e.target).text(e.target.id+' '+'Commencing');
      $('#stop-me').val(e.target.id)      
      $(e.target).prop('disabled', false);
      $('#stop-me').prop('disabled', false);
      $($('video')[0]).hide();
      $("#videos").hide();
      $('.thumbnails').show();

      myTimer = window.setTimeout(function(){window.this.stopTimer(e,testType,taskInfo)},duration)


    },

    //This is the function to turn off a camera
    stopTimer: function(e,testtype,taskInfo) {
     // console.log('Name:'+''+window.targetClient)
     // console.log('isTask4?:'+''+(taskInfo.id == 'Task4'))
      window.socket.emit('trigger', {message:'stop'+window.targetClient,test:'',taskNum: taskInfo.id});
	  clearTimeout(myTimer);
	  $(e.target).text(e.target.id+' '+'Completed');
	  $(e.target).val('Completed');
	  //console.log($(e.target).val());
	  $('#stop-me').prop('disabled', true);
	  if (e.target.id =='Task4'){
	  window.alert("All tasks completed please log out the user");
	  document.getElementById('logoff').style.visibility = "visible";
	  //$('#logoff').style.visibility = 'visible';
	  }
    },
    stopTrigger: function(e){
         var confirmation = window.confirm("Stop the Current Task?")
         console.log('task =' +e.target.value); 
         curTask = document.getElementById(e.target.value);
         
         console.log('curTask='+curTask);
         if (confirmation){
		  clearTimeout(myTimer);
          window.socket.emit('trigger',{message:'stop'+window.targetClient,test:'',taskNum: e.target.value+'_'+'incomplete'})
		      clearTimeout(myTimer);
          $(curTask).val("Stopped");
          $(curTask).text(curTask.id+" "+"Stopped");
         }

    },
    toggleActivateRecordButton: function() {
        // var b = $('#record-me');
        // $('#record-me').prop('disabled', !$('#record-me').prop('disabled'));
    },
    //This is what happens when the camera is turned on
    turnOnCamera: function() {
      // $('#record-me').prop('disabled', false);
      // $('video').hide();
      //window.video.controls = false;

      var finishVideoSetup_ = function() {
        // Note: video.onloadedmetadata doesn't fire in Chrome when using getUserMedia so
        // we have to use setTimeout. See crbug.com/110938.
        setTimeout(function() {
          window.video.width = 320;//video.clientWidth;
          window.video.height = 240;// video.clientHeight;
          // window.canvas is 1/2 for performance. Otherwise, getImageData() readback is
          // awful 100ms+ as 640x480.
          window.canvas.width = video.width;
          window.canvas.height = video.height;
          window.this.record(window.relevantCameras);
          console.log("Now triggering record...");
        }, 1000);
      };

      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;


      MediaStreamTrack.getSources(function (media_sources) {
          var counter = 0;
          window.cameraCounter = 0;
          for (var i = 0; i < media_sources.length; i++) {
              var media_source = media_sources[i];
              var constraints = {};

              // if audio device
              if (media_source.kind == 'audio') {
                  constraints.audio = {
                      optional: [{
                          sourceId: media_source.id
                      }]
                  };
              }

              // if video device
              //Figure out how many cameras there are
              // Hard limit of two webcams for Mac Mini
              if (media_source.kind == 'video' && window.cameraCounter < 2) {
                window.cameraCounter++;
              }

          }

          finishVideoSetup_();
      });
    },

    record: function(relevantCameras) {
      var elapsedTime = $('#elasped-time');
      var ctx = [window.canvas[0].getContext('2d'),window.canvas[1].getContext('2d'),window.canvas[2].getContext('2d'),window.canvas[3].getContext('2d')];
      window.canvas_HEIGHT = window.canvas.height;
      window.canvas_WIDTH = window.canvas.width;

      for(x = 0; x < relevantCameras.length; x++ ){
        var clientName = window.globalSession.split("cl:")[1]+"_"+relevantCameras[x];
        console.log("Client Name: " + clientName)
        window.socket.emit('start_camera', {message:relevantCameras[x]+"K:K"+clientName});
      }

      window.fmz = [[],[],[],[]]; // clear existing frames;
      startTime = Date.now();

      window.this.toggleActivateRecordButton();
      $('#stop-me').prop('disabled', false);

      function drawVideoFrame_() {
        for(x = 0; x < relevantCameras.length; x++ ){      
          var clientName = window.globalSession.split("cl:")[1]+"_"+relevantCameras[x];
          console.log("NOW EMITING:"+relevantCameras[x]+"K:K"+clientName);
          window.socket.emit('message', {message:relevantCameras[x]+"K:K"+clientName});
        }
      };

      //Send a preview image every 3 seconds (Via the "message" socket)
      window.refreshIntervalId = setInterval(function() {
        drawVideoFrame_();
        console.log("Now triggering frame...");
      }, 3000);

    },

    //Function to run when you receive a 'stop' command
    stopCamera: function(taskNum) {
      clearInterval(window.refreshIntervalId);
      //Stop all the cameras... need to spam it to compensate for FFMPEG close lag
      window.socket.emit('stop_cam', {message:"hey"});
      window.socket.emit('stop_cam', {message:"hey"});
      window.socket.emit('stop_cam', {message:"hey"});
      window.this.embedVideoPreview(taskNum);
      //console.log('stop camera'+taskNum)
    },

    //Send the final 'vid' socket upon ending recording the video
    embedVideoPreview: function(taskNum) {
      console.log("Now sending....");
      for(x = 0; x < window.relevantCameras.length; x++ ){
        window.socket.emit('vid', {message:window.globalSession.split("cl:")[1]+"_"+relevantCameras[x],taskNum:taskNum});
        //console.log('embVP'+taskNum)
      }
    },
    
    //Ignore this
    postMessage: function() {
      var that = this;

      console.log("posting message from GuestbookForm")

      var messageModel = new MessageModel();
      
      messageModel.save( { message: $('.message').val() }, {
        
        success: function () {
          console.log("GuestbookForm succes " + messageModel.get('message') )
          
          that.trigger('postMessage');
        },
        error: function () {
          console.log("GuestbookForm error on save");
        }

      });
    }

  });



  return GuestbookForm;

});
