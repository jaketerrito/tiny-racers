//Program3
//CSC 378
//Jacob Territo

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

   var keyMap = {}
   var drawing = false;
   var mx = 0;
   var my = 0;

   theCanvas.addEventListener("mousedown",onmousedown,false);
   function onmousedown(e) {
         drawing = true;
   }
   theCanvas.addEventListener("mousemove",onMouseMove,false);
   function onMouseMove(e){
   		 mx = e.x*(1000/theCanvas.width);
   		 my = e.y*(750/theCanvas.height);
         if(drawing){
            objects.push(new Polygon(mx,my,20,3,1));
         }
   }
   theCanvas.addEventListener("mouseup",onmouseup,false);
   function onmouseup(e) {
      drawing = false;
   }

   window.addEventListener('keydown',onKeyDown);
   function onKeyDown(e){
         if(keyMap[e.keyCode] > 1){
               return;
         }
         keyMap[e.keyCode] = 1;
   }
   window.addEventListener('keyup',onKeyUp);
   function onKeyUp(e){
         keyMap[e.keyCode] = 0;
   }


   var myCar = new Car(100, 100,0);
   setInterval(drawScreen, 1000 / 30);
   var objects = [];
   makeMap(objects);

   var cars = []
   cars.push(myCar);
   function drawScreen() {
      context.fillStyle = 'grey';
      context.fillRect(0,0,1000,750);
      myCar.draw();
      for(object of objects){
      		object.draw();
      }
      var crashed = false;
      for(object of objects){
            if(object.checkCollision(cars) != null){
                  myCar.crash();
                  crashed = true;
                  break;
            }
      }
      if(!crashed){
      	myCar.go();
      }
      checkKeys(myCar,keyMap);
      myCar.move();

      //Mouse pos for debug
      /*
      context.font = "50px Arial";
      context.strokeStyle = 'red';
      context.strokeText(mx,500,300);
      context.strokeText(my,500,400);
      */
   }
}

//can't turn when colliding
//slowly decellerate when not doing anything
//map with collisions
//skid marks when turn angle is tight
//stop just decelerates reallllly fast, with skid marks
//sound

//Next Iteration:
// -AI
// -multiplayer
// -drifting 

function makeMap(objects){
      var shape = new Collidable(1);
      shape.points = [new Point(0,0), new Point(1000,0), new Point(1000,750), new Point(0,750),new Point(0,20),new Point(20,20),new Point(20,730),new Point(980,730),new Point(980,20),new Point(0,20)]
      objects.push(shape);
      shape = new Polygon(400,375,200,6,1);
      objects.push(shape);
      shape = new Polygon(800,250,100,4,1);
      objects.push(shape);
      shape = new Polygon(550,200,100,4,1);
      objects.push(shape);
      shape = new Polygon(950,250,100,4,1);
      objects.push(shape);
      shape = new Polygon(600,550,100,4,1);
      objects.push(shape);
      shape = new Polygon(750,550,100,4,1);
      objects.push(shape);
}

function checkKeys(myCar,keyMap){
      for(var key in keyMap){
               if(keyMap[key] > 0){
                     keyMap[key]+= 1/30;
                     if(key == 38){
                           myCar.speedUp();
                     }
                     if(key == 40){
                           myCar.slowDown();
                     }  
                     if(key == 37){
                           myCar.turnLeft(keyMap[key]);
                     }
                     if(key == 39){
                           myCar.turnRight(keyMap[key]);
                     }
                     if(key == 32){
                           myCar.stop();
                     }
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

function pointIn(points,point){
      for(var c = false, i = -1, l = points.length, j = l - 1; ++i < l; j = i)
            ((points[i].y <= point.y && point.y < points[j].y) || (points[j].y <= point.y && point.y < points[i].y))
            && (point.x < (points[j].x - points[i].x) * (point.y - points[i].y) / (points[j].y - points[i].y) + points[i].x)
            && (c = !c);
      return c;
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

      checkCollision(collidables){
            for(var collidable of collidables){
                  if(collidable.id == this.id){
                        continue;
                  }
                  for(var point of collidable.points){
                        if(pointIn(this.points,point)){
                              return collidable;
                        }
                  }
            }
            return null;
      }
}

class Polygon extends Collidable {
      //polygons, with array of points relative to center, and same collision detection as in polyhunt, rotate updates the points about center
      constructor(x,y,r, sides,id){
            super(id);
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

class Car extends Collidable{
      constructor(x,y,id){
            super(id);
            this.x = x;
            this.y = y;
            this.width = 60;
            this.height = this.width/2;
            this.points = [new Point(this.x-this.width/2,this.y-this.height/2+5),new Point(this.x-this.width/2,this.y+this.height/2-5),new Point(this.x+this.width/2,this.y+this.height/2-5),new Point(this.x+this.width/2,this.y-this.height/2+5)]
            this.pointoffsets = [new Point(-this.width/2,-this.height/2+5),new Point(-this.width/2,this.height/2-5),new Point(this.width/2,this.height/2-5),new Point(this.width/2,-this.height/2+5)]
            this.vel = 0;
            this.angle = 0;
            this.stopped = false;
            this.MAXVEL = 12;
            this.MAXTURN = Math.PI / 4;
            this.img = new Image();
            this.img.src = "car.png";
      }

      draw(){
            //COLLISION BOX
            /*var outline = 'grey';
            var color = 'black';
            context.beginPath();
            context.strokeStyle = outline; 
            context.fillStyle = color;
            context.lineWidth=2;
            context.moveTo(this.points[0].x,this.points[0].y);
            for(var i = 1; i < this.sides; i ++){ 
                  context.lineTo(this.points[i].x,this.points[i].y);
            } 
            context.lineTo(this.points[0].x,this.points[0].y);
            context.stroke(); 
            context.fill();
            context.closePath();*/
            //CAR
            context.save();
            context.translate(this.x,this.y);
            context.rotate(this.angle);
            context.drawImage(this.img,-this.width/2,-this.height/2,this.width,this.height);
            context.restore();
            
      }

      go(){
      	this.stopped = false;
      }

      move(){
            this.x += this.vel * Math.cos(this.angle);
            this.y += this.vel * Math.sin(this.angle);
            for(var point of this.points){
                  point.x += this.vel * Math.cos(this.angle);
                  point.y += this.vel * Math.sin(this.angle);
            }
      }

      speedUp(){
            if(this.vel < this.MAXVEL){
                  if(this.vel < .5){
                        this.vel += .4;
                  } else {
                        this.vel += .2;
                  }
            }else{
                  this.vel = this.MAXVEL;
            }
      }

      slowDown(){
            if(this.vel > -this.MAXVEL){
                  if(this.vel > -.5){
                        this.vel -= .4;
                  } else {
                        this.vel -= .2;
                  }
            } else {
                  this.vel = -this.MAXVEL;
            }
      }

      stop(){
            this.vel = 0;
            this.stopped = true;
      }

      crash(){
      		this.vel = 0;
      		if(!this.stopped){
            	playSound("crash.mp3",1);
      		}
            this.stopped = true;

      }

      turnRight(factor){
      		if(this.stopped){
      			return;
      		}
            var change;
            if((2+factor**2) * Math.PI/180 < this.MAXTURN){
                  change = (2+factor**2)*(Math.PI/180);
            } else {
                  change = this.MAXTURN;
            }
            this.angle += change;


            for(var i = 0; i < this.points.length; i++){
                  this.points[i].x = ((this.pointoffsets[i].x) * Math.cos(this.angle))-((this.pointoffsets[i].y) * Math.sin(this.angle)) + this.x;
                  this.points[i].y = ((this.pointoffsets[i].y) * Math.cos(this.angle))+((this.pointoffsets[i].x) * Math.sin(this.angle)) + this.y;
            }
      }

      turnLeft(factor){
      	    if(this.stopped){
      	    	return;
      	    }
            var change
            if((2+factor**2) * Math.PI/180 < this.MAXTURN){
                  change = -(2+ factor**2)*(Math.PI/180);
            } else {
                  change = -this.MAXTURN;
            }
            this.angle += change;

            for(var i = 0; i < this.points.length; i++){
                  this.points[i].x = ((this.pointoffsets[i].x) * Math.cos(this.angle))-((this.pointoffsets[i].y) * Math.sin(this.angle)) + this.x;
                  this.points[i].y = ((this.pointoffsets[i].y) * Math.cos(this.angle))+((this.pointoffsets[i].x) * Math.sin(this.angle)) + this.y;
            }
      }
}

function playSound(sound,volume) {		
		var tempSound = document.createElement("audio");
		tempSound.setAttribute("src", sound);
		tempSound.volume = volume;
		tempSound.loop = false;
		tempSound.play();
}