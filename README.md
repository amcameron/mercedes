## The Mercedes Application

### The Basics


This application lets you capture video on two computers, record it, save it and post-process it. 


### Step 1: Running the Application

Running the application is easy... after you clone this repo, cd into it (i.e "cd mercedes") and use "node server.js" to run it. Note: You need to install node.js on your system in order for this to run.

Rather than explaining how to do that, go to http://nodejs.org/download/

You need to run the application on all 3 computers -- i.e, the main computer for the invigilators as well as the 2 computers running the test.

### Step 2: Opening the Invigilator Dashboard

After you have it running on all 3 terminals, first go to your invigilator dashboard (Note: This is important -- you have to access the application from the invigilator computer before you do it from the other two).

To access the dashboard, open your web browser (use Google Chrome), and go to http://TESTER_IP:8080 ... TESTER_IP is the local IP address of each of the tester computers (since all 3 computers will be on a LAN). In other words, you will need to open up 2 seperate tabs for each of the computers.

Once you open both applications, click "invigilator" in both, put in the authorization, and you can fly. 

### Step 3: Opening the tester application 

Now, go to each tester computer, and go to http://localhost:8080 and click "Tester". Put in your tester authorization. Now, you can minimize the window or leave it in the background....IMPORTANT: Do not open a new tab in this Chrome Window. Open a new Chrome Window entirely for the rest of your pages.

On your invigilator dashboard, click on "Start Test" for each of the tester computers. NOTE: You may need to go to the tester computer the first time to "allow" the camera. Soon, you'll see some preview images coming to the invigilator dashboard.

### Step 4: Naming the Camera

By default, the cameras will be named numbers "0, 1, 2" etc. However, you can click below the preview thumbnails to change the name... type in the name then click outside of it (don't press 'Enter').

### Step 5: Stopping the Test

When you're done, click on "Stop Test". After you stop it, it'll take a little while to process the video... you'll see the loading at the bottom ("Converting..."). Wait until that's finished before doing anything -- it usually takes the duration of the video. So if you recorded for 7 minutes it takes 7 minutes to process/convert.

After converting, you can open it in the portal, (Click on "process" beside it). After it's done converting, the videos will be saved to your computer. You can see it in the "Unprocessed VIdeos" folder in the Mercedes folder. Feel free to do as you like at this point.

You can use the dashboard (Open localhost:8080/#dashboard in the invigilator computer) to run the bash script for each video to send it to Christian's algorithm.

### Step 6: Manual Annotation

In case the algorithm fails, and you want to do manual anotation, that is built as well. First -- open a new terminal window and run "python -m SimpleHTTPServer 8000". You might need to install python, just follow the on-screen instructions. Minimize that. For simplicity I recommend running that as a bash command from Christian's algorithm.

Now, you can access the annotation software from http://localhost:8080/annotate.html#video=[URL], where URL is the local URL of the video. You can test it out here: http://localhost:8080/annotate.html#video=http://media.w3.org/2010/05/sintel/trailer.webm#video=http://html5demos.com/assets/dizzy.mp4

You can add multiple videos by appending #video=VIDEORUL to it. In order for it to work correctly, you should run it in MOZILLA FIREFOX. Note: Due to Firefox's bandwidth issues, you might need to let the video buffer occasionally.

After you're done annotating the frame-by-frame blinks, click on export to get a text file with everything.