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
    thumbs: function(e){
      console.log("y u no click");
      $($('video')[0]).attr('src',$(e.target).attr('video-url'));
      $("#saveVideo").attr('href',$(e.target).attr('video-url'));
    },
    invPrompt: function(){
      // var x = prompt("Enter authorization code.","");
      // if(x == 'television')
         window.this.doInv();
      // else
      //   alert("Authorization failed.");
    },
    tstPrompt: function(){

      $('#numu').parent().hide();
      window.globalSession = prompt("Enter unique tester identifier.","");
      if (window.globalSession != null && window.globalSession != '')
        window.this.doTst();
    },
    doInv: function(){
    $('#numu').parent().show();
    window.socket = io.connect();

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

    window.socket.on('message', function(data){
      console.log("O HAI DER SENOR");
      var master_Client = data.message.split('x:x')[0];
      var thumbnail = data.message.split('x:x')[1].split("K:K")[0];
      var theName = data.message.split('x:x')[1].split("K:K")[1];
      // console.log("HELLO"); 
      // console.log(master_Client);
      // console.log(window.globalSession.split('cl:')[1])
      if(window.globalSession.split('cl:')[1] == master_Client){
        // console.log("You are the invigilator");
        $("#video-preview").show();
        $('#tester-preview').hide();
        if(thumbnail.indexOf('jpg') != -1){
          var newImg = document.createElement("img");
          $(newImg).attr("id","theImg").attr("height","200px").attr("width","300px").attr("src","/temp/"+thumbnail);
          console.log("Got one!");
          console.log(theName);
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
        console.log("Whatup we got:"+thumbnail);
        $('#numu').parent().show();
      } else {
        console.log("You are not the invigilator");
        $("#video-preview").hide();
        $('#tester-preview').show();
        $('.thumbnails').html('');  
        $('#numu').parent().hide();  
      }
    });

    socket.on('num', function(data){
      var testers = data.message;
      testers =jQuery.grep(testers, function(value) { return value != window.globalSession.split('cl:')[1]; });
      window.client_list = testers;
      $('#numu').html(testers.length);
    });

    window.socket.on('progress', function(data){
      var name = data.message.split("Q:Q")[0];
      var progress = data.message.split("Q:Q")[1];
      console.log(data.message);
      console.log(progress);
      $("#videos").show();
      if(!$("#span-"+name).length)
        $("#videos").append($(document.createElement("span")).attr("id","span-"+name));
      var string = name;
      if($("#lightbox-"+name+" label").html() != "Click here to name Camera"){
        string = name.split("_")[0]+"_"+$("#lightbox-"+name+" label").html();
      }
      $("#span-"+name).html('Converting video for '+string+', please wait....elapsed time '+progress+'<br/>');
    });

    window.socket.on('vid', function(data){
      var a = document.createElement("a");
      var a2 = document.createElement("a");
      a.download = data.message.split(".")[0]+".webm";
      a2.download = data.message.split(".")[0]+".mpg";
      if($("#lightbox-"+data.message.split(".")[0]+" label").html() != "Click here to name Camera"){
        a.download = data.message.split(".")[0].split("_")[0]+"_"+$("#lightbox-"+data.message.split(".")[0]+" label").html()+".webm";
        a2.download = data.message.split(".")[0].split("_")[0]+"_"+$("#lightbox-"+data.message.split(".")[0]+" label").html()+".mpg";
      }
      a.href = data.message.split(".")[0]+".webm";
      a2.href = data.message.split(".")[0]+".mpg";
      $(a).html("here");
      a2.click();
      a.click();
      console.log("downloading!"+data.message.split(".")[0]+".webm");
      if(!$("#span-"+data.message.split(".")[0]).length)
        $("#videos").append($(document.createElement("span")).attr("id","span-"+data.message.split(".")[0]));
      $("#span-"+data.message.split(".")[0]).html('Video '+data.message.split(".")[0]+'.webm finished converting. Click <a href="'+a.href+'" download="'+a.download+'">here</a> to download.<br/>');
      var master_Client = data.message.split('x:x')[0];
      var url = data.message.split('x:x')[1];
      $("#saveVideo").show();
      if(window.globalSession.split('cl:')[1] == master_Client){
        console.log("We are makingd it hello" + window.runningClients);
        console.log(window.runningClients == false);
        if(window.runningClients.length == 0){
          console.log('we here');
          console.log(window.runningClients);
          $('.thumbnails').hide();
          $($('video')[0]).attr('src',url);
          $($('video')[0]).show();
          $("#videos").show();
        }
      }
    });

    window.socket.on('pic', function(data){
      var master_Client = data.message.split('x:x')[0];
      console.log("We gotta new pic!");
      var url = data.message.split('x:x')[1].split("D:D")[0];
      console.log(url);
      var nowDate = new Date().getMonth()+1 + "-" + new Date().getDate() + "-" + new Date().getFullYear();
      var downloadName = data.message.split('x:x')[1].split("D:D")[1].split("B:B")[0];
      console.log(downloadName);
      var videoURL = data.message.split('x:x')[1].split("D:D")[1].split("B:B")[1];
      console.log(videoURL);
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
          console.log("NOW WE STRIKE"+downloadName);

 
          // $($("#saveVideo")[0]).attr('download',downloadName+"_"+nowDate+'.webm');
          // $("#videos .thumbs:last").click();
          // $("#saveVideo")[0].click();
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
    window.socket = io.connect();

    window.globalSession = "cl:"+window.globalSession;

    window.socket.on('message', function(data){
      console.log("WE GOT SOMETHING");
      var master_Client = data.message.split('x:x')[0];
      var thumbnail = data.message.split('x:x')[1];
      console.log(master_Client);
      console.log(window.globalSession.split('cl:')[1])
      if(window.globalSession.split('cl:')[1] == master_Client){
        // console.log("You are the invigilator");
        $("#video-preview").show();
        $('#tester-preview').hide();
        console.log("This is:"+thumbnail);
        if(thumbnail.indexOf('data:image/webp') != -1){
          console.log("Got one!");
          $($('.thumbnails')[window.counter]).html('<img id="theImg" src="'+thumbnail+'" />');
          if(window.counter == 7){
            window.counter = 0;
          } else {
            window.counter++;
          }
        }
        $('#numu').parent().show();
      } else {
        // console.log("You are not the invigilator");
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
        console.log("We are making it hello" + window.runningClients);
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
			var that = this;
      $(this.el).html(mainTemplate);
      
		} 
	});
  return MainView;

});
