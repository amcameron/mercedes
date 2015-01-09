// Require.js allows us to configure shortcut alias
// Their usage will become more apparent futher along in the tutorial.
require.config({
  paths: {
    // Major libraries
    jquery: 'libs/jquery/jquery-min',
    underscore: 'libs/underscore/underscore-min', // https://github.com/amdjs
    backbone: 'libs/backbone/backbone-min', // https://github.com/amdjs
    io: '../socket.io/socket.io',
    //whammy: 'http://html5-demos.appspot.com/static/getusermedia/whammy.min',    
    whammy: 'libs/msr/VideoStreamRecorder/lib/whammy2',
    cbd: 'libs/msr/common/Cross-Browser-Declarations',
    os: 'libs/msr/common/ObjectStore',
    asr: 'libs/msr/AudioStreamRecorder/StereoRecorder',
    sar: 'libs/msr/AudioStreamRecorder/StereoAudioRecorder',
    mr: 'libs/msr/AudioStreamRecorder/MediaRecorder',
    wr: 'libs/msr/VideoStreamRecorder/WhammyRecorder',
    wrh: 'libs/msr/VideoStreamRecorder/WhammyRecorderHelper',
    gr: 'libs/msr/VideoStreamRecorder/GifRecorder',
    ge: 'libs/msr/VideoStreamRecorder/lib/gif-encoder',
    wm: 'libs/msr/VideoStreamRecorder/lib/whammy',
    rrtc: 'libs/recordrtc/RecordRTC',
    // Require.js plugins
    text: 'libs/require/text',

    // Just a short cut so we can put our html outside the js dir
    // When you have HTML/CSS designers this aids in keeping them out of the js directory
    templates: '../templates'
  }

});

// Let's kick off the application

require([
  'router/MainRouter'
], function(MainRouter){
  
  MainRouter.initialize();

});
