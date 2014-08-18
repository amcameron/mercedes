
define([
  'jquery',
  'underscore',
  'backbone',
  'io',
  'views/MainView', 
  'views/cabin/CabinView',
  'views/dashboard/DashboardView',
], function ($, _, Backbone, io, MainView, CabinView, DashboardView) {
  
  var MainRouter = Backbone.Router.extend({
    routes: {
      'messages': 'showMessageAboutMongo', // All urls will trigger this route
      'about': 'showAbout',
      'dashboard': 'showDashboard', 
      '*actions': 'defaultAction',
    }
  });

  var initialize = function(){
		
    //var vent = _.extend({}, Backbone.Events);
    var router = new MainRouter();

    console.log("MainRouter / initialize");

		router.on('route:defaultAction', function (actions) {

        var mainView = new MainView();
        mainView.render();

        // var cabinView = new CabinView();
        // cabinView.render();

        console.log("default route");
        
		});

    router.on('route:showMessageAboutMongo', function () {

      console.log("display helpful message about setting up mongo");
        
    });

    router.on('route:showAbout', function () {

      console.log("display about");
        
    });

    router.on('route:showDashboard', function() {

      var dashboardView = new DashboardView();
      dashboardView.render();

      console.log("We outchyea");

    })

    Backbone.history.start();
    
  };
  return {
    initialize: initialize
  };
});
