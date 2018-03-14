//Program3
//CSC 378
//Jacob Territo


var objects = [];
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
      toPoly(data.objects);
      toCar(data.cars);
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

   function drawScreen(){
      context.fillStyle = 'grey';
      context.fillRect(0,0,1000,750);
      for(thing of objects){
         thing.draw();
      }
      console.log(cars);
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

function toPoly(list){
   var temp = [];
   for(thing of list){
      temp.push(new Polygon(thing.x,thing.y,thing.r,thing.sides));
   }
   objects = temp.slice();
}
class Collidable {
      constructor(id){
            this.id = id;
            this.points = [];
      }

      draw(){
            var outline = 'grey';
            var color = 'black';
            context.beginPath();
            context.strokeStyle = outline; 
            context.fillStyle = color;
            context.lineWidth=2;
            context.moveTo(this.points[0].x,this.points[0].y);
            for(var i = 1; i < this.points.length; i ++){ 
                  context.lineTo(this.points[i].x,this.points[i].y);
            } 
            context.lineTo(this.points[0].x,this.points[0].y);
            context.stroke(); 
            context.fill();
            context.closePath();
      }
}
class Polygon extends Collidable {
	constructor(x,y,r, sides){
            super(1);
            this.x = x;
            this.y = y;
            this.r = r;
            this.sides = sides;
            var center = new Point(this.x,this.y);
            this.points.push(hex_corner(center,this.r,this.sides,0));
            for(var i = 1; i < this.sides; i++){
                  this.points.push(hex_corner(center,this.r,this.sides,i));
            }
      }
}
function hex_corner(center, size, sides, i){
            var angle_deg = 360/sides * i + 180/sides;
            var angle_rad = Math.PI / 180 * angle_deg;
            return new Point(center.x + size * Math.cos(angle_rad),center.y + size * Math.sin(angle_rad));
}

function Point(x,y){
      this.x = x;
      this.y = y;
}
class Car extends Collidable{
      constructor(x,y,angle,id){
         super(id);
         this.x = x;
         this.y = y;
         this.angle = angle;
         this.id = id;
         this.width = 60;
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
