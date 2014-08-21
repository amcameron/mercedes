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

    render: function () {
      window.this = this;

      window.socket.on('trigger', function(data){
        var msg = data.message.split('cl:')[0];
        var target_Client = data.message.split('cl:')[1];
        console.log("We got a start request");
        console.log(data.message);
        console.log(target_Client);
        console.log(window.globalSession);
        if(msg.match('stop')){
          var name = msg.split("stop")[1];
          if(window.globalSession.split('cl:')[1] == name)
            window.this.stopCamera();
        }
        if (target_Client != 'undefined'){
          if (window.globalSession.split('cl:')[1] == target_Client){
            if(msg == 'on'){
              window.this.turnOnCamera();
            }
          }
        } else {
          console.log("Anyone out there?");
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

      navigator.getUserMedia = navigator.getUserMedia ||
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
          navigator.msGetUserMedia;

      window.ORIGINAL_DOC_TITLE = document.title;
      window.video = $('video');
      window.canvas = [document.createElement('canvas'),document.createElement('canvas'),document.createElement('canvas'),document.createElement('canvas')];      var rafId = null;
      var startTime = null;
      var endTime = null;
      var frames = [];
      window.recordRTC = [];
      window.previewImage = [];
      window.globalStream = [];
      window.runningClients = [];



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

      // function $(selector) {
      //   return document.querySelector(selector) || null;
      // }

      // exports.$ = $;
      $(this.el).html(guestbookFormTemplate);
      return this;
    },
    turnOnTrigger: function(e) {
      window.targetClient = prompt("Input tester name ("+window.client_list+")","");
      window.socket.emit('trigger', {message:'oncl:'+window.targetClient});
      window.runningClients.push(window.targetClient);
      $(e.target).prop('disabled', false);
      $('#stop-me').prop('disabled', false);
      $($('video')[0]).hide();
      $("#videos").hide();
      $('.thumbnails').show();
    },
    stopTrigger: function(e) {
      var name = prompt("Input tester name ("+window.runningClients+")","");
      window.runningClients.remove(name);
      window.socket.emit('trigger', {message:'stop'+name});
    },
    toggleActivateRecordButton: function() {
        // var b = $('#record-me');
        // $('#record-me').prop('disabled', !$('#record-me').prop('disabled'));
    },

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
          window.cameraCounter = 1;
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
              if (media_source.kind == 'video') {
                window.cameraCounter++;
                  // constraints.video = {
                  //     mandatory: {
                  //         // chromeMediaSource: 'screen',
                  //         minWidth: 1920,
                  //         minHeight: 1080,

                  //         maxWidth: 1920,
                  //         maxHeight: 1080,
                  //     },
                  //     optional: [{
                  //         sourceId: media_source.id
                  //     }]
                  // };
                  // console.log("Dis is " + media_source.kind);
                  // console.log(i);

                  // navigator.getUserMedia(constraints, function(stream) {

                  //   var options = {
                  //      type: 'video',
                  //      video: {
                  //         width: 640,
                  //         height: 480
                  //      },
                  //      canvas: {
                  //         width: 640,
                  //         height: 480
                  //      }
                  //   };
                  //   window.recordRTC[counter] = RecordRTC(stream, options);
                  //   recordRTC[counter].startRecording();

                  //   window.globalStream.push(stream);
                  //   $($('video')[counter]).attr('src',window.URL.createObjectURL(stream));
                  //   counter++;
                  //   window.camera = "Camera"+counter;
                  // }, function(e) {
                  //   console.log("No video.");
                  // });
                  
              }

          }

          finishVideoSetup_();
      });

      // navigator.getUserMedia({video: true, audio: false}, function(stream) {
      //   window.globalStream = stream;
      //   $('video').attr('src',window.URL.createObjectURL(stream));
      //   finishVideoSetup_();
      // }, function(e) {
      //   alert('Fine, you get a movie instead of your beautiful face ;)');
      //   video.src = 'Chrome_ImF.mp4';
      //   finishVideoSetup_();
      // });
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
        
        // rafId = requestAnimationFrame(drawVideoFrame_);
        for(x = 0; x < window.cameraCounter; x++ ){
            

          // ctx[x].drawImage($('video')[x], 0, 0, window.canvas_WIDTH, window.canvas_HEIGHT);

          //console.log('Recording...' + Math.round((Date.now() - startTime) / 1000) + 's');

          // Read back window.canvas as webp.
          //console.time('window.canvas.dataURL() took');
          // var url = window.canvas[x].toDataURL('image/webp', 1); // image/jpeg is way faster :(
          //console.timeEnd('window.canvas.dataURL() took');
          //console.log(url);
          var clientName = window.globalSession.split("cl:")[1]+"_"+x;
          console.log("NOW EMITING:"+x+"K:K"+clientName);
          window.socket.emit('message', {message:x+"K:K"+clientName});
          // window.previewImage[x] = url;
          // console.log(url);
          
          // window.fmz[x].push(url);

       }
        // UInt8ClampedArray (for Worker).
        //frames.push(ctx.getImageData(0, 0, window.canvas_WIDTH, window.canvas_HEIGHT).data);

        // ImageData
        //frames.push(ctx.getImageData(0, 0, window.canvas_WIDTH, window.canvas_HEIGHT));
      };

      // rafId = requestAnimationFrame(drawVideoFrame_);
      window.refreshIntervalId = setInterval(function() {
        drawVideoFrame_();
        console.log("Now triggering frame...");
      }, 3000);

    },

    stopCamera: function() {
      // cancelAnimationFrame(rafId);
      // endTime = Date.now();
      console.log("Stop in the name of the law!");
      clearInterval(window.refreshIntervalId);
      window.socket.emit('stop_cam', {message:"hey"});
      window.socket.emit('stop_cam', {message:"hey"});
      window.socket.emit('stop_cam', {message:"hey"});
      // $('#stop-me').disabled = true;
      // document.title = window.ORIGINAL_DOC_TITLE;

      // window.this.toggleActivateRecordButton();

      // console.log('frames captured: ' + frames.length + ' => ' +
      //             ((endTime - startTime) / 1000) + 's video');

      window.this.embedVideoPreview();
    },

    embedVideoPreview: function(opt_url) {
      console.log("We've made it here!");
      // var url = opt_url || null;
      // var video = $('#video-preview video') || null;
      // var downloadLink = $('#video-preview a[download]') || null;

      // if (!video) {
      //   video = document.createElement('video');
      //   video.autoplay = true;
      //   video.controls = true;
      //   video.loop = true;
      //   //video.style.position = 'absolute';
      //   //video.style.top = '70px';
      //   //video.style.left = '10px';
      //   video.style.width = window.canvas.width + 'px';
      //   video.style.height = window.canvas.height + 'px';
      //   $('#video-preview').appendChild(video);
        
      //   downloadLink = document.createElement('a');
      //   downloadLink.download = 'capture.webm';
      //   downloadLink.textContent = '[ download video ]';
      //   downloadLink.title = 'Download your .webm video';
      //   var p = document.createElement('p');
      //   p.appendChild(downloadLink);
      //   $('#video-preview').appendChild(p);

      // } else {
      //   window.URL.revokeObjectURL(video.src);
      // }

      // https://github.com/antimatter15/whammy
      // var encoder = new Whammy.Video(1000/60);
      // frames.forEach(function(dataURL, i) {
      //   encoder.add(dataURL);
      // });
      // var webmBlob = encoder.compile();

      // if (!url) {
      //   var webmBlob = Whammy.fromImageArray(window.fmz[0], 1000 / 200);
      //   url = window.URL.createObjectURL(webmBlob);
      // }

      // jQuery.each( window.recordRTC, function( i, val ) {

      //   window.recordRTC[i].stopRecording(function(videoURL) {
      //     var url = videoURL;
      //     var cameranum = i+1;
      //     window.socket.emit('pic', {message:window.previewImage[i]+"D:D"+window.globalSession.split("cl:")[1]+cameranum+"B:B"+url});
      //     console.log(videoURL);
      //     console.log("Yeah bruh we got it");
      //     video.src = url;
      //     downloadLink.href = url;
      console.log("Now sending....");
      for(x = 0; x < window.cameraCounter; x++ ){
        window.socket.emit('vid', {message:window.globalSession.split("cl:")[1]+"_"+x});
      }
      
      //   });
      // });

      // jQuery.each(window.globalStream, function(e){
      //   window.globalStream[e].stop();
      // });
      
    },
    
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
