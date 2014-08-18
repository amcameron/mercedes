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
    },
    render: function () {
      
      $(this.el).css("background-color","#FBFBFB").css("box-shadow","inset 0 0 0 rgba(0,0,0,.5)").css("color","#333333").css("text-shadow","0 0 0 rgba(0,0,0,.5)");
      $(this.el).html(dashboardTemplate);
      console.log("Howdy ho senor");

    }

  });

  return GuestbookForm;
});
