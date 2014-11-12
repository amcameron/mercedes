define([
  'jquery',
  'underscore',
  'backbone',
  'io',
  'text!templates/mainTemplate.html',
  'views/cabin/CabinView'
], function($, _, Backbone, io, mainTemplate, CabinView){
  
  var MainView = Backbone.View.extend({
    el: '.container',
    events: {
      'click #inv': 'invPrompt',
      'click #tst': 'tstPrompt',
      'click .thumbs': 'thumbs',
    },
    initialize: function () {
      window.this = this;

      $('body').css('background-color','#333333');
    },
    //Legacy function.
    thumbs: function(e){
      $($('video')[0]).attr('src',$(e.target).attr('video-url'));
      $("#saveVideo").attr('href',$(e.target).attr('video-url'));
    },
    //Uncomment the stuff in here if you want to add an invigilator authorization code
    invPrompt: function(){
      // var x = prompt("Enter authorization code.","");
      // if(x == 'television')
         window.this.doInv();
      // else
      //   alert("Authorization failed.");
    },
    //Launch a tester
    tstPrompt: function(){
      $('#numu').parent().hide();
      window.globalSession = prompt("Enter unique tester identifier.","");
      if (window.globalSession != null && window.globalSession != '')
        window.this.doTst();
    },
    //Run all of this stuff after you've signed on as an invigilator
    doInv: function(){
    $('#numu').parent().show();
    window.socket = io.connect();

    //Authorization stuff... not too relevant
    window.globalSession = "globalcl:"+Math.random().toString(36).slice(2);
    window.tl;
    window.counter = 0;

    var onImgLoad = function(selector, callback){
      $(selector).each(function(){
          if (this.complete || /*for IE 10-*/ $(this).height() > 0) {
              callback.apply(this);
          }
          else {
              $(this).on('load', function(){
                  callback.apply(this);
              });
          }
      });
    };

    //Get the extension specified in server.js
    window.socket.on('ext', function(data){
      window.ext = data.message;
    });

    window.socket.on('message', function(data){
      var master_Client = data.message.split('x:x')[0];
      var thumbnail = data.message.split('x:x')[1].split("K:K")[0];
      console.log("thumbnail");
      console.log(thumbnail);
      var theName = data.message.split('x:x')[1].split("K:K")[1];
      console.log("theName");
      console.log(theName)

      //This takes in preview images from the 'message' socket and embeds it onto the page
      if(window.globalSession.split('cl:')[1] == master_Client){
        $("#video-preview").show();
        $('#tester-preview').hide();
        if(thumbnail.indexOf('jpg') != -1){
          var newImg = document.createElement("img");
          $(newImg).attr("id","theImg").attr("height","200px").attr("width","300px").attr("src","/temp/"+thumbnail);

          if(!$("#lightbox-"+theName).length){
            var newDiv = document.createElement("div");
            $(newDiv).attr("id","lightbox-"+theName).addClass("thumbnails").css("float","left").css("border","3px solid white").css("margin-right","5%").css("margin-bottom","5%")
            $("#s1").append(newDiv);
          }
          if(!$("#lightbox-"+theName).find('img').length){
            $("#lightbox-"+theName).html(newImg);
            $("#lightbox-"+theName).append("<div><label for='theImg' contenteditable='true'>Click here to name Camera</label></div>");
          } else {
            $("#lightbox-"+theName).find('img').attr("src","/temp/"+thumbnail)
          }

          if(window.counter == 7){
            window.counter = 0;
          } else {
            window.counter++;
          }
        }
        $('#numu').parent().show();
      } else {
        $("#video-preview").hide();
        $('#tester-preview').show();
        $('.thumbnails').html('');  
        $('#numu').parent().hide();  
      }
    });

    //Get number of clients
    socket.on('num', function(data){
      var testers = data.message;
      testers =jQuery.grep(testers, function(value) { return value != window.globalSession.split('cl:')[1]; });
      window.client_list = testers;
      $('#numu').html(testers.length);
    });

    //After finishing video recording, show 'progress' of converting to .webm
    window.socket.on('progress', function(data){
      var name = data.message.split("Q:Q")[0];
      var progress = data.message.split("Q:Q")[1];

      $("#videos").show();
      if(!$("#span-"+name).length)
        $("#videos").append($(document.createElement("span")).attr("id","span-"+name));
      var string = name;
      if($("#lightbox-"+name+" label").html() != "Click here to name Camera"){
        string = name.split("_")[0]+"_"+$("#lightbox-"+name+" label").html();
      }
      $("#span-"+name).html('Converting video for '+string+'_'+data.taskNum+', please wait....elapsed time '+progress+'<br/>');
    });

    //Get the name of the video after it is done converting, and generate the download link
    window.socket.on('vid', function(data){
      var a = document.createElement("a");
      var a2 = document.createElement("a");
      //a.download = data.message.split(".")[0]+'_'+data.taskNum+".webm";
      a2.download = data.message.split(".")[0]+'_'+data.taskNum+window.ext;
      if($("#lightbox-"+data.message.split(".")[0]+" label").html() != "Click here to name Camera"){
        //a.download = data.message.split(".")[0].split("_")[0]+"_"+$("#lightbox-"+'_'+data.message.split(".")[0]+" label").html()+'_'+data.taskNum+".webm";
        a2.download = data.message.split(".")[0].split("_")[0]+"_"+$("#lightbox-"+'_'+data.message.split(".")[0]+" label").html()+'_'+data.taskNum+window.ext;
      }

      //a.href = data.message.split(".")[0]+'_'+data.taskNum+".webm";
      a2.href = data.message.split(".")[0]+'_'+data.taskNum+window.ext;
      $(a).html("here");
      //$(a2).html("here");
      a2.click();
      //a.click();
      if(!$("#span-"+data.message.split(".")[0]).length)
        $("#videos").append($(document.createElement("span")).attr("id","span-"+'_'+data.message.split(".")[0]));
      //$("#span-"+data.message.split(".")[0]).html('Video '+data.message.split(".")[0]+'_'+data.taskNum+'.webm finished converting. Click <a href="'+a.href+'" download="'+a.download+'">here</a> to download.<br/>');
      $("#span-"+data.message.split(".")[0]).html('Video '+data.message.split(".")[0]+data.taskNum+window.ext+'finished converting. Click <a href="'+a2.href+'" download="'+a2.download+'">here</a> to download.<br/>');
      var master_Client = data.message.split('x:x')[0];
      var url = data.message.split('x:x')[1];
      $("#saveVideo").show();
      if(window.globalSession.split('cl:')[1] == master_Client){
        if(window.runningClients.length == 0){
          $('.thumbnails').hide();
          $($('video')[0]).attr('src',url);
          $($('video')[0]).show();
          $("#videos").show();
        }
      }
    });

    window.socket.on('remove_display', function(data){

      // Remove the Lightbox
      console.log("removing" + data.message.split(".")[0]);
      $("#lightbox-"+data.message.split(".")[0]).remove();

    });

    //Legacy stuff, disregard
    window.socket.on('pic', function(data){
      var master_Client = data.message.split('x:x')[0];
      var url = data.message.split('x:x')[1].split("D:D")[0];
      var nowDate = new Date().getMonth()+1 + "-" + new Date().getDate() + "-" + new Date().getFullYear();
      var downloadName = data.message.split('x:x')[1].split("D:D")[1].split("B:B")[0];
      var videoURL = data.message.split('x:x')[1].split("D:D")[1].split("B:B")[1];

      if(window.globalSession.split('cl:')[1] == master_Client){
        // $('.thumbnails').hide();
        window.tl = document.createElement('img');
        window.tl.src = url;
        $(window.tl).attr('class','thumbs');
        $(window.tl).attr('video-url',videoURL);
        $('#videos').append(tl);
        $($("#saveVideo")[0]).attr('download',downloadName+"_"+nowDate+'.webm');
        $($("#saveVideo")[0]).attr('href',videoURL);  
        $("#saveVideo")[0].click();
        setTimeout(function() {
          setTimeout(function(){
            console.log("Emiting...");
            window.socket.emit('dl', {message:downloadName+"_"+nowDate+'.webm'});
          }, 5000);
        }, 2500);
      }
    });

    window.socket.emit('message', {message:window.globalSession});
    var cabinView = new CabinView();
    cabinView.render();
    },
    doTst: function(){

    //These functions are fallbacks to prevent random errors because of an HTML5
    //Video kickback issue. You don't really have to worry about any of this.
    window.socket = io.connect();

    window.globalSession = "cl:"+window.globalSession;

    window.socket.on('message', function(data){
      var master_Client = data.message.split('x:x')[0];
      var thumbnail = data.message.split('x:x')[1];
      if(window.globalSession.split('cl:')[1] == master_Client){
        $("#video-preview").show();
        $('#tester-preview').hide();
        if(thumbnail.indexOf('data:image/webp') != -1){
          $($('.thumbnails')[window.counter]).html('<img id="theImg" src="'+thumbnail+'" />');
          if(window.counter == 7){
            window.counter = 0;
          } else {
            window.counter++;
          }
        }
        $('#numu').parent().show();
      } else {
        $("#video-preview").hide();
        $('#tester-preview').show();
        $('.thumbnails').html('');   
        $('#numu').parent().hide();
      }
    });

    window.socket.on('vid', function(data){
      var master_Client = data.message.split('x:x')[0];
      var url = data.message.split('x:x')[1];
      if(window.globalSession.split('cl:')[1] == master_Client){
        if(window.runningClients.length == 0){
          $('.thumbnails').hide();
          $($('video')[0]).attr('src',url);
          $($('video')[0]).show();
          $("#videos").show();
        }
      }
    });

    window.socket.emit('message', {message:window.globalSession});
    var cabinView = new CabinView();
    cabinView.render();

    $('#numu').parent().hide();
    },
    render: function () {
      //Generate template.
			var that = this;
      $(this.el).html(mainTemplate);
      
		} 
	});
  return MainView;

});
