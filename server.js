/*

==================================
General information about the code
==================================

Server.js is the file that handles all the server communications. Bash commands
(control "f" 'spawn' to see the various bash commands) are handled here,
and all the socket input output is done here. 

EVERYTHING is done through sockets. Video screenshots are taken client-side, 
and then sent to the invigilator using sockets. The socket's are SENT in the individual
"view" (/app/views/).


Labeling is a bit funky. "Guestbook" is the name for all the views/models associated
with the tester. "Dashboard" is the name of all the views/models associated with
the dashboard. In other words, views/guestbook/GuestbookFormView.js is the view that
handles all the tester stuff. It has literally everything.

TL;DR: All the code that comprises this application is over the following 4 files:

- Server.js
- app/js/views/MainView.js
- app/js/guestbook/GuestbookFormView.js
- app/js/dashboard/DashboardView.js

Mostly the first 3.

The rest of it is occasionally referenced, but you largely don't have to worry about it.

The workflow is as follows:


MainView is the main invigilator application. It handles most of the stuff on the 
invigilator page, and redirects you if you click "tester". DashboardView has some
invigilator stuff, but mostly just a simple post-processing.

GuestbookFormView handles most of the video-related stuff. Turning on, turning off,
posting, saving, etc. is primarily handled on GuestbookFormView, although some of it
is handled in the MainView as well (depending on what scope is needed).

Server.js is what connects the two. It takes triggers from MainView (see the sockets).
And then it sends a "on" or "off" command (or whatever) to GuestbookFormView. Additionally,
when GuestbookFormView sends a photo/video, the Server.js file takes it, and sends
it back to the invigilator on MainView.js.


*/


//Variables you can change

var downloadPath = '/Users/naeem/Downloads'; //Path to Downloads folder with no trailing forward slash
var localFilePath = '/Users/naeem/Documents/Summer\ Research/mercedes'; //Path to locally hosted mercedes folder with no trailing forward slash. Make sure to backslash spaces.
var chromeAlias ='/Applications/Google\ Chrome.app'; //Whatever the alias or location is for Google Chrome (try open alias on shell to test)
var os = "osx"; //The OS on this system -- do either "osx" or "ubuntu"
var outputExtension = ".mpg" //What extension/encoding type do you want to output
//Your ffmpeg script (see README). use [CAMERANO] to denote where the camera number is, and [OUTPUT] -- make the rest whatever settings you want
var ffmpeg = "ffmpeg -f avfoundation -i [CAMERANO] -r 30 [OUTPUT]";
//DONT TOUCH ANYTHING ELSE UNLESS YOU KNOW WHAT YOU'RE DOING

//http server
var fs = require('fs');
var httpServer = require('http');
var path = require('path');
var connect = require('connect');
//mongo server
var mongoose = require('mongoose/');
var restify = require('restify');  

var config = require('./config');

var sys = require('sys')
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var child;
var mime = require('mime');


//Sockets
var io = require('socket.io');

// localhost

var httpPort = process.env.PORT || 8080;
var mongodbPort = 8888;

/* 
 
 see README.md for a more detailed write up 

*/

//////////////////////////////////////////////////////// HTTP - sends html/js/css to the browswer 


//This stuff here is just showing how the server serves the HTML content.

var sendHTML = function( filePath, contentType, response ){

  //console.log('sendHTML: ' + filePath) ;

  path.exists(filePath, function( exists ) {
     
        if (exists) {
            var bytesize = 0;
            fs.stat(filePath, function (err, stats) {
              if(filePath.match(".webm")){
              console.log(filePath);
              console.log(stats.size);
              bytesize = stats.size;
              }
            });
            var start = 0;
            var end = 1;
            var chunk = end - start + 1;
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end();
                }
                else {
                  if(!filePath.match('.webm'))
                    response.writeHead(200, { 'Content-Type': contentType });
                  else
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            response.writeHead(404);
            response.end();
        }
    });
}

var getFilePath = function(url) {

  var filePath = './app' + url;
  if (url == '/' ) filePath = './app/index.html';

  //console.log("url: " + url)

  return filePath;
}

var getContentType = function(filePath) {
   
   var extname = path.extname(filePath);
   var contentType = mime.lookup(filePath);
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    return contentType;
}

var onHtmlRequestHandler = function(request, response) {

  //console.log('onHtmlRequestHandler... request.url: ' + request.url) ;

  /*
   when this is live, nodjitsu only listens on 1 port(80) so the httpServer will hear it first but
   we need to pass the request to the mongodbServer
   */
  if ( process.env.PORT && url === '/messages') {
    
    // pass the request to mongodbServer
   

    return; 
  } 

  var filePath = getFilePath(request.url);
  var contentType = getContentType(filePath);

  //console.log('onHtmlRequestHandler... getting: ' + filePath) ;

  sendHTML(filePath, contentType, response); 

}

var server = httpServer.createServer(onHtmlRequestHandler).listen(httpPort); 

//Setting up all the socket information

var webSocket = io.listen(server);
var clients = [];
var sockets = [];
var children = [];


//Start the sockets! 'Connection' socket triggers when the page is loaded by someone.

webSocket.sockets.on('connection', function (client) {

    //Send the extension variable to the client so it knows what to use
    webSocket.sockets.emit('ext', {message: outputExtension});


    //Message is a catch-all socket. I send a lot of stuff through this.
    client.on('message', function(data){
      var mg = data.message;

      //I send a client ID with "cl:" -- so if the message contains "cl:"
      //I know it has a client ID. I use unique client ID's to
      //Calculate the number of clients.

      if(mg.indexOf('cl:') != -1){
        if(mg.split('cl:')[0] == 'global'){
          clients.unshift(mg.split('cl:')[1])
          sockets.unshift(client);
        } else {
          clients.push(mg.split('cl:')[1])
          sockets.push(client);
        }
        //Emit how many clients are currently signed on
        webSocket.sockets.emit('num', {message: clients});
      }

      //Don't worry about this
      var msg = clients[0]+'x:x'+data.message;
      if(mg.indexOf('cl:') != -1)
        client.emit('message', {message: msg});


      //So here we get the PREVIEW IMAGE (every few seconds) from a running feed.
      var imageName = msg.split('x:x')[1].split("K:K")[1];
      var cameraNumber = msg.split('x:x')[1].split("K:K")[0];
      var uniqueId = new Date().getTime();

      //Spawn/child runs Bash Scripts. First, delete any cached preview images.
      var child2 = spawn("rm", ['-Rf','app/temp']);
      children.push(child2);
      child2.on('close', function (code) {

        //Make a temp folder to store the preview images.
        var child3 = spawn("mkdir", ['app/temp/']);
        child3.on('close', function (code) {
          console.log('created folder');
          var child;
          //Change bash script depending on the OS. Run ffmpeg and get 1 frame
          //vframes 1 gets 1 frame, which is basically a single image
          if(os == "osx")
            var child = spawn("ffmpeg", ['-f','avfoundation','-i',''+cameraNumber+'','-vframes','1','app/temp/'+imageName+'_'+uniqueId+'.jpg']);
          else
            var child = spawn("ffmpeg", ['-f', 'v4l2', '-framerate', '25', '-video_size', '640x480', '-vframes', '1', '-i', '/dev/video'+cameraNumber, 'app/temp/'+imageName+'_'+uniqueId+'.jpg']);
          children.push(child);
          child.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
          });
          child.on('close', function (code) {
            console.log('child process exited with code ' + code);
            //As long as we have a valid image, send it to the invigilator 
            if(typeof imageName != 'undefined'){
              var msg = clients[0]+'x:x'+imageName+"_"+uniqueId+'.jpgK:K'+imageName;
              client.broadcast.emit('message', {message: msg});
              child.kill();
              //Kill child processes for memory's sakes
            }
          });
          child.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
          });
        });


      });
    });
  
    //If we get a "start camera" command from the invigilator
    client.on('start_camera', function(data) {
      console.log("START CAMERA TRIGGERED");
      var imageName = data.message.split("K:K")[1];
      var cameraNumber = data.message.split("K:K")[0];
      console.log("CAMERA NUMBER RECIEVED " + cameraNumber)

      var child2 = spawn("rm", ['-Rf','app/'+imageName+outputExtension]);
      children.push(child2);
      child2.on('close', function (code) {
        console.log('deletedfile');

        //This stuff here uses the ffmpegArr global variable to create the command

        var ffmpegArr = ffmpeg.split(" ");
        ffmpegArr.shift();
        for ( k = 0; k < ffmpegArr.length; k++ ){
          if(ffmpegArr[k] == "[CAMERANO]"){
            ffmpegArr[k] = cameraNumber;
          } else if(ffmpegArr[k] == "[OUTPUT]"){
            ffmpegArr[k] = 'app/'+imageName+outputExtension;
          }
        }

        //Now we run a child process (bash command) using the ffmpegArr
        var child = spawn("ffmpeg", ffmpegArr);
        children.push(child);
        child.stdout.on('data', function (data) {
          console.log('stdout: ' + data);
        });
        child.on('close', function (code) {
          console.log('child process exited with code ' + code);
        });
        child.stderr.on('data', function (data) {
          console.log('stderr: ' + data);
        });
      });
    })

    //After the videos are all downloaded, we need to pull them
    //From the downloads folder, and move them to the unprocessed_vids folder
    //That's all that this entire function is doing... it's moving all the
    //.webm and .outputExtension files from the downloads folder to the
    //Unprocessed vids folder... which you can see in the #dashboard view
    client.on('dashboard', function(data){
      client.emit('localpath', {message: localFilePath});
      var child = spawn("ls", [downloadPath]);
      children.push(child);
      var sendArray = [];
      var dlArray = [];
      child.stdout.on('data', function (data) {
        var newArray = data.toString().split("\n");
        for(var y = 0; y < newArray.length; y++){
          dlArray.push(newArray[y]);
        } 
      });
      child.on('close', function (code) {

        for (var i=dlArray.length-1; i>=0; i--) {
            if (!dlArray[i].match(outputExtension) && !dlArray[i].match(".webm")) {
                dlArray.splice(i, 1);
            } else {
              sendArray.push(dlArray[i]);
            }
        }
        var child3 = spawn("ls", ["app/unprocessed_vids"]);

        child3.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString().split("\n"));
        var newArray = data.toString().split("\n");
        for(var y = 0; y < newArray.length; y++){
          sendArray.push(newArray[y]);
        }     
        });
        child3.on('close', function (code) {
        for (var i=sendArray.length-1; i>=0; i--) {
            if (!sendArray[i].match(outputExtension) && !sendArray[i].match(".webm")) {
                sendArray.splice(i, 1);
            }
        }
        console.log('child process dashboard exited with code ' + code);
        client.emit('dashboard', {message: sendArray});
        for(x = 0; x < dlArray.length; x++){
          var value = dlArray[x];
          console.log("HELLO! "+value+" \n");
          var child2 = spawn("mv", [downloadPath+'/'+value,'app/unprocessed_vids']);
          child2.stdout.on('data', function(data){
            console.log('stdout: ' +data);
          })
          child2.stderr.on('data', function(data){
            console.log('stderr: ' + data);
          })
          child2.on('close', function(code){
            console.log("close with " + code);
            child2.kill();
          })
        }
        child3.kill();
      });
        child.kill();
      });
      child.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
      });
    })

    //Get a 'stop camera' command
    client.on('stop_cam', function(data) {
      console.log('killing', children.length, 'child processes');
      children.forEach(function(child) {
        child.kill();
      });
    })

    //Transferring video from tester to invigilator
    client.on('vid', function(data) {
      var mg = data.message;
      if(mg.indexOf('cl:') == 0){
        clients.push(mg.split('cl:')[1])
      }

      var msg = data.message+outputExtension;
      //We convert the video (app/msg/) into a .webm video, because annotate.html
      //Accepts .webm videos
      var child = spawn("ffmpeg", ['-i','app/'+msg+'','-s','640x480','app/'+data.message+'.webm']);
      child.stdout.on('data', function (data) {
        console.log('trying webm convert');
      });
      child.on('close', function (code) {
        console.log('finished webm convert');
        client.broadcast.emit('vid', {message: msg});
        client.broadcast.emit('remove_display', {message: msg});
      });
      child.stderr.on('data', function (data) {
        console.log('issue with webm convert: ' + data.toString().split("time=")[1]);
        client.broadcast.emit('progress', {message: mg+"Q:Q"+data.toString().split("time=")[1]});
      });
      
    })

    //Random function don't worry about this
    client.on('dl', function(data) {
      var mg = data.message;
      var nm = mg.split(".webm")[0]+".mp4";
      child = exec("ffmpeg -i /Users/naeem/Downloads/" + mg + " " + nm, function (error, stdout, stderr) {
        sys.print('stdout: ' + stdout);
        sys.print('stderr: ' + stderr);

        if (error !== null) {
          console.log('exec error: ' + error);
        }
      });
      var child = spawn("ffmpeg", ['-i','/Users/naeem/Downloads/' + mg, nm]);
      child.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
      });
      child.on('close', function (code) {
        console.log('child process exited with code ' + code);

        child_2 = exec("rm -Rf /Users/naeem/Downloads/" + mg, function (error, stdout, stderr) {
          console.log("Deleted file");
          if (error !== null) {
            console.log('exec error: ' + error);
          }
        });

      });
      child.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
      });
    })

    //Sending thumbnails
    client.on('pic', function(data) {
      var mg = data.message;
      if(mg.indexOf('cl:') == 0){
        clients.push(mg.split('cl:')[1])
      }

      var msg = clients[0]+'x:x'+data.message;
      client.broadcast.emit('pic', {message: msg});
    })

    client.on('trigger', function(data) {
      client.broadcast.emit('trigger', {message: data.message, test: data.test});
    })
      
    client.on('disconnect', function() {
      var i = sockets.indexOf(client);
      sockets.splice(i,1);
      clients.splice(i,1);
      webSocket.sockets.emit('num', {message: clients});
    });

});

////////////////////////////////////////////////////// MONGODB - saves data in the database and posts data to the browser


//DON'T WORRY ABOUT ANYTHING BEYOND THIS POINT. IRRELEVANT.

var mongoURI = ( process.env.PORT ) ? config.creds.mongoose_auth_jitsu : config.creds.mongoose_auth_local;

db = mongoose.connect(mongoURI),
Schema = mongoose.Schema;  

var mongodbServer = restify.createServer({
    formatters: {
        'application/json': function(req, res, body){
            if(req.params.callback){
                var callbackFunctionName = req.params.callback.replace(/[^A-Za-z0-9_\.]/g, '');
                return callbackFunctionName + "(" + JSON.stringify(body) + ");";
            } else {
                return JSON.stringify(body);
            }
        },
        'text/html': function(req, res, body){
            return body;
        }
    }
});

mongodbServer.use(restify.bodyParser());

// Create a schema for our data
var MessageSchema = new Schema({
  message: String,
  date: Date
});

// Use the schema to register a model
mongoose.model('Message', MessageSchema); 
var MessageMongooseModel = mongoose.model('Message'); // just to emphasize this isn't a Backbone Model


/*

this approach was recommended to remove the CORS restrictions instead of adding them to each request
but its not working right now?! Something is wrong with adding it to mongodbServer

// Enable CORS
mongodbServer.all( '/*', function( req, res, next ) {
  res.header( 'Access-Control-Allow-Origin', '*' );
  res.header( 'Access-Control-Allow-Method', 'POST, GET, PUT, DELETE, OPTIONS' );
  res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, X-File-Name, Content-Type, Cache-Control' );
  if( 'OPTIONS' == req.method ) {
  res.send( 203, 'OK' );
  }
  next();
});


*/


// This function is responsible for returning all entries for the Message model
var getMessages = function(req, res, next) {
  // Resitify currently has a bug which doesn't allow you to set default headers
  // This headers comply with CORS and allow us to mongodbServer our response to any origin
  res.header( 'Access-Control-Allow-Origin', '*' );
  res.header( 'Access-Control-Allow-Method', 'POST, GET, PUT, DELETE, OPTIONS' );
  res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, X-File-Name, Content-Type, Cache-Control' );
  
  if( 'OPTIONS' == req.method ) {
    res.send( 203, 'OK' );
  }
  
  console.log("mongodbServer getMessages");

  MessageMongooseModel.find().limit(20).sort('date', -1).execFind(function (arr,data) {
    res.send(data);
  });
}

var postMessage = function(req, res, next) {
  res.header( 'Access-Control-Allow-Origin', '*' );
  res.header( 'Access-Control-Allow-Method', 'POST, GET, PUT, DELETE, OPTIONS' );
  res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, X-File-Name, Content-Type, Cache-Control' );


  if( 'OPTIONS' == req.method ) {
    res.send( 203, 'OK' );
  }
  
  // Create a new message model, fill it up and save it to Mongodb
  var message = new MessageMongooseModel(); 
  
  console.log("mongodbServer postMessage: " + req.params.message);

  message.message = req.params.message;
  message.date = new Date() 
  message.save(function () {
    res.send(req.body);
  });
}

mongodbServer.listen(mongodbPort, function() {
  
  var consoleMessage = '\n A Simple MongoDb, Mongoose, Restify, and Backbone Tutorial'
  consoleMessage += '\n +++++++++++++++++++++++++++++++++++++++++++++++++++++' 
  consoleMessage += '\n\n %s says your mongodbServer is listening at %s';
  consoleMessage += '\n great! now open your browser to http://localhost:8080';
  consoleMessage += '\n it will connect to your httpServer to get your static files';
  consoleMessage += '\n and talk to your mongodbServer to get and post your messages. \n\n';
  consoleMessage += '+++++++++++++++++++++++++++++++++++++++++++++++++++++ \n\n'  
 
  console.log(consoleMessage, mongodbServer.name, mongodbServer.url);
  mime.define({
      'video/webm': ['webm']
  });
  console.log("Now looking up..."+mime.lookup('http://localhost:8080/radical1.webm'));

});


mongodbServer.get('/messages', getMessages);
mongodbServer.post('/messages', postMessage);


