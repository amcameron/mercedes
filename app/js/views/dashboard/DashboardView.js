define([
  'jquery',
  'underscore',
  'backbone',
  'io',
  'models/MessageModel',
  'text!templates/dashboard/dashboardTemplate.html',
  'whammy'
], function($, _, Backbone, io, MessageModel, dashboardTemplate, whammy){
  
  var GuestbookForm = Backbone.View.extend({

    el: 'body',  
    events: {
      "click .annotate": "annotate",
    },
    render: function () {
      
      $(this.el).css("background-color","#FBFBFB").css("box-shadow","inset 0 0 0 rgba(0,0,0,.5)").css("color","#333333").css("text-shadow","0 0 0 rgba(0,0,0,.5)");
      $(this.el).html(dashboardTemplate);
      console.log("Howdy ho senor");
      window.socket = io.connect();
      window.socket.emit('dashboard', {message:'start'});
      window.arr = [];
      window.localPath;

      window.socket.on('localpath', function(data){
        window.localPath = data.message;
      });


      window.socket.on('dashboard', function(data){
        console.log(data.message);
        $.each(data.message, function( index, value ) {
          if(value.match(".mpg"))
            window.arr.push(value);
        });
        console.log(window.arr);
        $.each(window.arr, function(i,v){
          $("#videos").append("Video name: "+v.split('.mpg')[0]+" | (<a download="+v+" href='unprocessed_vids/"+v+"'>Download</a> : <a href='#'>Process</a> : <a class='annotate' href='#' data-url='"+window.localPath+"/app/annotate.html#video=unprocessed_vids/"+v.split('.mpg')[0]+".webm'>Annotate</a>)<br>");
        });
        
      });
    },

    annotate: function(e){
      window.socket.emit('annotate', {message:$(e.target).attr("data-url")});
    }

  });

  return GuestbookForm;
});
