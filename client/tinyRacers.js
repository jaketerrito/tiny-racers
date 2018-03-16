//Program3
//CSC 378
//Jacob Territo


var cars = [];
window.addEventListener('load', eventWindowLoaded, false);
//event listener executes eventWindowLoaded once the canvas window is loaded.

function eventWindowLoaded() {
	canvasApp();	
}

function canvasApp(){
   theCanvas = document.getElementById('canvas');
   if (!theCanvas || !theCanvas.getContext) { return; }
   context = theCanvas.getContext('2d');
   if (!context) {return; } 

   window.addEventListener('resize', resizeCanvas, false);
   resizeCanvas();		

   function redraw(){
         context.strokeStyle = 'blue';
	 context.lineWidth = '5';
	 context.strokeRect(0, 0, window.innerWidth, window.innerHeight);
   }
		
   function resizeCanvas() {
	 theCanvas.width = window.innerWidth;
	 if(theCanvas.width * (3/4) > window.innerHeight){
	    theCanvas.width = window.innerHeight * (4/3);
	    theCanvas.height = window.innerHeight;
	 }else{
	    theCanvas.height = theCanvas.width*(3/4);
	 }
	 context.scale(theCanvas.width/1000,theCanvas.height/750);
	 redraw();
   }

   theCanvas.addEventListener("mousedown",onmousedown,false);
   function onmousedown(e) {
         console.log("new Point("+e.x+","+e.y+"),");
   }


   window.addEventListener('keydown',onKeyDown);
   function onKeyDown(e){
         socket.emit('keyDown',e.keyCode)
   }
   window.addEventListener('keyup',onKeyUp);
   function onKeyUp(e){
         socket.emit('keyUp',e.keyCode);
   }

   var socket = io();
   socket.connect();
   socket.on('initialize',init);
   function init(data){
      toCar(data);
      drawScreen();
   }
   socket.on('crash',crash);
   function crash(data){
      playSound("/client/crash.mp3",1);
   }
   socket.on('update',update);
   function update(data){
      toCar(data.cars);
      drawScreen();
   }

   var background = new Image();
   background.src = "/client/track.jpg";
   function drawScreen(){
      context.drawImage(background,-50,-50,1100,850);
      for(car of cars){
         car.draw();
      }
   }
}

function toCar(list){
   var temp = [];
   for(car of list){
      temp.push(new Car(car.x,car.y,car.angle,car.id));
   }
   cars = temp.slice();
}

function Point(x,y){
      this.x = x;
      this.y = y;
}
class Car{
      constructor(x,y,angle,id){
         this.id = id;
         this.x = x;
         this.y = y;
         this.angle = angle;
         this.id = id;
         this.width = 40;
         this.height = this.width/2;
         this.img = new Image();
         this.img.src = "/client/car.png";
      }

      draw(){
            context.save();
            context.translate(this.x,this.y);
            context.rotate(this.angle);
            context.drawImage(this.img,-this.width/2,-this.height/2,this.width,this.height);
            context.restore();
            
      }
}

function playSound(sound,volume) {		
		var tempSound = document.createElement("audio");
		tempSound.setAttribute("src", sound);
		tempSound.volume = volume;
		tempSound.loop = false;
		tempSound.play();
}
