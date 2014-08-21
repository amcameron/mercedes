
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

//Setting up socket shenanigans

var webSocket = io.listen(server);
var clients = [];
var sockets = [];
var children = [];
console.log("here we are");





// child = exec("xmessage hi", function (error, stdout, stderr) {
//   sys.print('stdout: ' + stdout);
//   sys.print('stderr: ' + stderr);
//   console.log("HALLO?");
//   if (error !== null) {
//     console.log('exec error: ' + error);
//   }
// });

webSocket.sockets.on('connection', function (client) {
    console.log("Wee got a connection..");
    // console.log(client.id);
    
    // this works great:    
    // plain message - this never works :(
    client.on('message', function(data){
      var mg = data.message;
      // console.log("GOT SOMETHING");
      // console.log(mg);
      if(mg.indexOf('cl:') != -1){
        if(mg.split('cl:')[0] == 'global'){
          clients.unshift(mg.split('cl:')[1])
          sockets.unshift(client);
        } else {
          clients.push(mg.split('cl:')[1])
          sockets.push(client);
        }
        webSocket.sockets.emit('num', {message: clients});
      }
      var msg = clients[0]+'x:x'+data.message;
      // console.log("The message is"+msg);
      if(mg.indexOf('cl:') != -1)
        client.emit('message', {message: msg});

      var imageName = msg.split('x:x')[1].split("K:K")[1];
      var cameraNumber = msg.split('x:x')[1].split("K:K")[0];
      var uniqueId = new Date().getTime();
      var child2 = spawn("rm", ['-Rf','app/temp']);
      children.push(child2);
      child2.on('close', function (code) {
        console.log('deletedfile');
        var child3 = spawn("mkdir", ['app/temp/']);
        child3.on('close', function (code) {
          console.log('created folder');
          var child = spawn("ffmpeg", ['-f','avfoundation','-i',''+cameraNumber+'','-vframes','1','app/temp/'+imageName+'_'+uniqueId+'.jpg']);
          children.push(child);
          child.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
          });
          child.on('close', function (code) {
            console.log('child process exited with code ' + code);
            if(typeof imageName != 'undefined'){
              var msg = clients[0]+'x:x'+imageName+"_"+uniqueId+'.jpgK:K'+imageName;
              client.broadcast.emit('message', {message: msg});
              child.kill();
            }
          });
          child.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
          });
        });


      });
      console.log(imageName);
      // var child2 = spawn("rm", ['-Rf',imageName+'.jpg']);
      // child2.on('close', function (code) {
      //   console.log('deletedfile');
      //   var child = spawn("ffmpeg", ['-f','avfoundation','-i','0','-vframes','1','outie1.jpg']);
      //   child.stdout.on('data', function (data) {
      //     console.log('stdout: ' + data);
      //     child.kill();
      //   });
      //   child.on('close', function (code) {
      //     child.stdin.pause();
      //     child.kill();
      //     console.log('child process exited with code ' + code);
      //     var msg = clients[0]+'x:x'+imageName+'.jpgK:K'+imageName;
      //     client.broadcast.emit('message', {message: msg});
      //   });
      //   child.stderr.on('data', function (data) {
      //     console.log('stderr: ' + data);
      //     child.stdin.pause();
      //     child.kill();
      //   });
      //   child2.stdin.pause();
      //   child2.kill();
      // });



    });
  
    client.on('start_camera', function(data) {
      console.log("START CAMERA TRIGGERED");
      var imageName = data.message.split("K:K")[1];
      var cameraNumber = data.message.split("K:K")[0];

      var child2 = spawn("rm", ['-Rf','app/'+imageName+'.mpg']);
      children.push(child2);
      child2.on('close', function (code) {
        console.log('deletedfile');
        var child = spawn("ffmpeg", ['-f','avfoundation','-i',''+cameraNumber+'','app/'+imageName+'.mpg']);
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

    client.on('stop_cam', function(data) {
      console.log('killing', children.length, 'child processes');
      children.forEach(function(child) {
        child.kill();
      });
    })
    client.on('vid', function(data) {
      var mg = data.message;
      if(mg.indexOf('cl:') == 0){
        clients.push(mg.split('cl:')[1])
      }
      console.log("WE GOT A VIDEO");
      var msg = data.message+'.mpg';
      var child = spawn("ffmpeg", ['-i','app/'+msg+'','-s','640x480','app/'+data.message+'.webm']);
      child.stdout.on('data', function (data) {
        console.log('trying webm convert');
      });
      child.on('close', function (code) {
        console.log('finished webm convert');
        client.broadcast.emit('vid', {message: msg});
      });
      child.stderr.on('data', function (data) {
        console.log('issue with webm convert: ' + data.toString().split("time=")[1]);
        client.broadcast.emit('progress', {message: mg+"Q:Q"+data.toString().split("time=")[1]});
      });
      
    })

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

    client.on('pic', function(data) {
      var mg = data.message;
      if(mg.indexOf('cl:') == 0){
        clients.push(mg.split('cl:')[1])
      }

      var msg = clients[0]+'x:x'+data.message;
      client.broadcast.emit('pic', {message: msg});
    })

    client.on('trigger', function(data) {
      client.broadcast.emit('trigger', {message: data.message});
    })
      
    client.on('disconnect', function() {
      var i = sockets.indexOf(client);
      sockets.splice(i,1);
      clients.splice(i,1);
      webSocket.sockets.emit('num', {message: clients});
    });

});

////////////////////////////////////////////////////// MONGODB - saves data in the database and posts data to the browser

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


