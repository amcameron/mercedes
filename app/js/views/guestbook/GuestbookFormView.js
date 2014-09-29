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
  
  var GuestbookForm = Backbone.View.extend({
    el: '.guestbook-form-container',  
    events: {
      'click #start-test' : 'turnOnTrigger',
      'click #stop-me' : 'stopTrigger',
      'click .post-message': 'postMessage',
    },

    //These are all the functions that run when the view is rendered
    render: function () {
      window.this = this;

      //When you get a 'trigger' message, do stuff with it
      window.socket.on('trigger', function(data){
        var msg = data.message.split('cl:')[0];
        var target_Client = data.message.split('cl:')[1];
        console.log("We got a start request");
        console.log(data.message);
        console.log(target_Client);
        console.log(window.globalSession);
        if(msg.match('stop')){
          //If you get a 'stop 'message...
          var name = msg.split("stop")[1];
          if(window.globalSession.split('cl:')[1] == name)
            window.this.stopCamera();
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
    //This is the function to turn on a camera
    turnOnTrigger: function(e) {
      window.targetClient = prompt("Input tester name ("+window.client_list+")","");
      //Send the 'turn on' trigger via sockets
      window.socket.emit('trigger', {message:'oncl:'+window.targetClient});
      window.runningClients.push(window.targetClient);
      $(e.target).prop('disabled', false);
      $('#stop-me').prop('disabled', false);
      $($('video')[0]).hide();
      $("#videos").hide();
      $('.thumbnails').show();
    },
    //This is the function to turn off a camera
    stopTrigger: function(e) {
      var name = prompt("Input tester name ("+window.runningClients+")","");
      window.runningClients.remove(name);
      window.socket.emit('trigger', {message:'stop'+name});
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
          window.this.record();
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

    record: function() {
      var elapsedTime = $('#elasped-time');
      var ctx = [window.canvas[0].getContext('2d'),window.canvas[1].getContext('2d'),window.canvas[2].getContext('2d'),window.canvas[3].getContext('2d')];
      window.canvas_HEIGHT = window.canvas.height;
      window.canvas_WIDTH = window.canvas.width;

      for(x = 0; x < window.cameraCounter; x++ ){
        var clientName = window.globalSession.split("cl:")[1]+"_"+x;
        window.socket.emit('start_camera', {message:x+"K:K"+clientName});
      }

      window.fmz = [[],[],[],[]]; // clear existing frames;
      startTime = Date.now();

      window.this.toggleActivateRecordButton();
      $('#stop-me').prop('disabled', false);

      function drawVideoFrame_() {
        for(x = 0; x < window.cameraCounter; x++ ){      
          var clientName = window.globalSession.split("cl:")[1]+"_"+x;
          console.log("NOW EMITING:"+x+"K:K"+clientName);
          window.socket.emit('message', {message:x+"K:K"+clientName});
        }
      };

      //Send a preview image every 3 seconds (Via the "message" socket)
      window.refreshIntervalId = setInterval(function() {
        drawVideoFrame_();
        console.log("Now triggering frame...");
      }, 3000);

    },

    //Function to run when you receive a 'stop' command
    stopCamera: function() {
      clearInterval(window.refreshIntervalId);
      //Stop all the cameras... need to spam it to compensate for FFMPEG close lag
      window.socket.emit('stop_cam', {message:"hey"});
      window.socket.emit('stop_cam', {message:"hey"});
      window.socket.emit('stop_cam', {message:"hey"});
      window.this.embedVideoPreview();
    },

    //Send the final 'vid' socket upon ending recording teh video
    embedVideoPreview: function(opt_url) {
      console.log("Now sending....");
      for(x = 0; x < window.cameraCounter; x++ ){
        window.socket.emit('vid', {message:window.globalSession.split("cl:")[1]+"_"+x});
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
