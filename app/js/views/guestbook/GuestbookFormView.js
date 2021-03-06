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
  'whammy',
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
      'click #stop-test' : 'forcelogoffTrigger'
    },

    //These are all the functions that run when the view is rendered
    render: function () {
      window.this = this;
      window.socket.on('reload',function(){location.reload(true);});



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
      var redu = 0; 
	  if (taskInfo.id == 'Task1' || taskInfo.id=='Task2')
				{testType = 'desktop'}
		  else	{testType = 'tablet'}


	  if(taskInfo.value.split('R:R')[0] =='incomplete' || taskInfo.value.split('R:R')[0] == 'Stopped')
	  {  
		 // if(taskInfo.id == 'Task1')
     if (window.runningClients.length == 0)
				{window.targetClient = prompt("Input tester name ("+window.client_list+")","");
				 window.runningClients.push(window.targetClient);
				}
      document.getElementById('stop-me').style.visibility = "visible";

        redu = 0
		  window.this.turnOnTrigger(e,taskInfo,testType,redu)
	  }
	  else{
	  restart = window.confirm(taskInfo.id+' '+'has been completed! Restart Task?')
	  if (restart){
      redu = 1;
      reduNum = taskInfo.value.split('R:R')[1];
      $(e.target).val('Incomplete'+'R:R'+reduNum);
	   window.this.turnOnTrigger(e,taskInfo,testType,redu,reduNum)
    }
	  } 

    },


    testCompletion: function(){

      var T1 = $(Task1).val();
      var T2 = $(Task2).val(); 
      var T3 = $(Task3).val(); 
      var T4 = $(Task4).val(); 

      T1 = T1.split("R:R")[0];
      T2 = T2.split("R:R")[0];
      T3 = T3.split("R:R")[0];
      T4 = T4.split("R:R")[0];
      //console.log(T1)
      if (T1 == "Completed" && T2 == "Completed" && T3 == "Completed" && T4 == "Completed" ) {
      window.alert("All tasks completed please wait for download and log out the user");
      document.getElementById('logoff').style.visibility = "visible";
      document.getElementById('stop-test').style.visibility = "hidden";
      console.log("all Completed");
      $('#stop-test').val("Completed");
      }
      else {
        console.log("not all Completed")
        $('#stop-test').val("incomplete")
        document.getElementById('logoff').style.visibility = "hidden";
        document.getElementById('stop-test').style.visibility = "visible";
        }
    },

    forcelogoffTrigger: function(e)
    {

      if (e.target.value == 'incomplete')
        {
          $('#stop-me').click();
          var confirmation = window.confirm("Test not complete, confirm logoff and exit ?")}
      else{var confirmation = window.confirm("Test complete, confirm logoff and exit ?")}
        if(confirmation)
          {
            window.this.logoffTrigger();
          }

    },

    logoffTrigger: function(e)
    {
      var name = prompt("Input the tester to logoff ("+window.client_list+")","");
      window.runningClients.remove(name);
      window.client_list.remove(name);
      window.alert(name+' '+'successfully logged off');
      location.reload(true);
      window.socket.emit('reload');  
	  //console.log('name ='+ e.target.id)
    },

    
    //This is the function to turn on a camera
    turnOnTrigger: function(e,taskInfo,testType,redu,reduNum) {
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

      window.this.testCompletion()
      
      if(!redu){
      myTimer = window.setTimeout(function(){window.this.stopTimer(e,testType,taskInfo.id,redu)},duration)
      }
      else
        { 
          myTimer = window.setTimeout(function(){window.this.stopTimer(e,testType,taskInfo.id+'_'+'Redo'+reduNum,redu,reduNum)},duration)          
        }

    },

    //This is the function to turn off a camera
    stopTimer: function(e,testtype,taskNum,redu,reduNum) {
     // console.log('Name:'+''+window.targetClient)
     // console.log('isTask4?:'+''+(taskInfo.id == 'Task4'))
      window.socket.emit('trigger', {message:'stop'+window.targetClient,test:'',taskNum: taskNum});
	  clearTimeout(myTimer);
	  $(e.target).text(e.target.id+' '+'Completed');

    var butVal = $(e.target).val();
    if (redu)
    {
        reduNum = parseInt(reduNum)+1;
        $(e.target).val('Completed'+'R:R'+reduNum.toString()); 
    }
    else 
    {
      $(e.target).val('Completed'+'R:R0');
    }

	  //console.log($(e.target).val());
	  $('#stop-me').prop('disabled', true);
	 // if (e.target.id =='Task4'){
	  //window.alert("All tasks completed please log out the user");
	 // document.getElementById('logoff').style.visibility = "visible";
	  //$('#logoff').style.visibility = 'visible';
	  //}
    console.log("Stop CompTest")
    window.this.testCompletion();
    },
    stopTrigger: function(e){
         var confirmation = window.confirm("Stop the Current Task?")
         console.log('task =' +e.target.value); 
         curTask = document.getElementById(e.target.value);
         var curTaskTxT = $(curTask).val();

         console.log('curTask='+curTask);
         if (confirmation){
		  clearTimeout(myTimer);
          window.socket.emit('trigger',{message:'stop'+window.targetClient,test:'',taskNum: e.target.value+'_'+'incomplete'})
		      clearTimeout(myTimer);
          $(curTask).val("Stopped"+'R:R'+curTaskTxT.split('R:R')[1]);
          $(curTask).text(curTask.id+" "+"Stopped");
          $('#stop-me').prop('disabled', true);
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
