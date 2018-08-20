//Program3
//CSC 378
//Jacob Territo
var tickLength = Math.floor(1000/30);
function getCar(search,cars){
   for(car of cars){
      if(car.id == search.id){
         return car;
      }
   }
   return null;
}

function updateWorld(cars,objects){
   var time = new Date().getTime();
   var tempList = []
   var crashed = [];
   for(var thing of objects){
      var collided = thing.checkCollision(cars);
      if(collided){
         for(var car of collided){
            if(!getCar(car,crashed)){
               crashed.push(car);
            }
         }
      }
   }

   for(var car of cars){
      var collided = car.checkCollision(cars);
      /*if(time-car.lastMove > 30000 && car.socket){
         car.socket.disconnect(true);
      }*/
      if(collided){
         for(other of collided){
            if(!getCar(car,crashed)){
               crashed.push(car);
            }
            if(!getCar(other,crashed)){
               crashed.push(other);
            }
         }
      }
      if(getCar(car,crashed)){
         car.crash();
      }else{
         car.go();
      }
      checkKeys(car);
      car.move();
      tempList.push(car.json());
   }
   return tempList;
}

function checkKeys(car){
      for(var key in car.keyMap){
               if(car.keyMap[key] > 0){
                     car.keyMap[key]+= 1/30;
                     if(key == 38){
                           car.speedUp();
                     }else if(key == 40){
                           car.slowDown();
                     }else{
                           car.coast();
                     }
                     if(key == 37){
                           car.turnLeft(car.keyMap[key]);
                     }
                     if(key == 39){
                           car.turnRight(car.keyMap[key]);
                     }
                     if(key == 32){
                           car.stop();
                     }
               }
        }
}

function makeMap(objects){
      //bounding box
      var shape = new Collidable(1);
      shape.points = [new Point(0,0), new Point(1000,0), new Point(1000,750), new Point(0,750),new Point(0,20),new Point(20,20),new Point(20,730),new Point(980,730),new Point(980,20),new Point(0,20)];
      objects.push(shape);
      //map
      shape = new Collidable(1);
      shape.points = [new Point(150,375), new Point(250,375), new Point(250,425), new Point(150,425)];
      objects.push(shape);
      shape = new Collidable(1);
      shape.points = [new Point(100,500), new Point(750,500), new Point(750,550), new Point(100,550)];
      objects.push(shape);
      shape = new Collidable(1);
      shape.points = [new Point(100,250), new Point(750,250), new Point(750,300), new Point(100,300)];
      objects.push(shape);

}

function hex_corner(center, size, sides, i){
            var angle_deg = 360/sides * i + 180/sides;
            var angle_rad = Math.PI / 180 * angle_deg;
            return new Point(center.x + size * Math.cos(angle_rad),center.y + size * Math.sin(angle_rad));
}

class Point {
   constructor(x,y){
      this.x = x;
      this.y = y;
   }
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
      checkCollision(collidables){
            var collided = [];
            for(var collidable of collidables){
               if(collidable.id == this.id){
                     continue;
               }
               for(var point of collidable.points){
                     if(pointIn(this.points,point)){
                           collided.push(collidable);
                     }
               }
            }
            if(collided.length == 0){
               return null;
            }
            return collided;
      }
}

class Polygon extends Collidable {
      //polygons, with array of points relative to center, and same collision detection as in polyhunt, rotate updates the points about center
      constructor(x,y,r, sides){
            super(0);
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

function makeCar(cars,id,socket){
   var spots = [[100,400],[100,100]];
   var car = new Car(0,0,id,socket);
   for(spot of spots){
      car.x = spot[0];
      car.y = spot[1];
      car.setPoints();
      if(!car.checkCollision(cars)){
         return car;
      }
   }
   return car;
}

class Car extends Collidable{
      constructor(x,y,id,socket){
            super(id);
            this.lastMove = new Date().getTime(); 
            this.speed = .3;
            this.rotspeed = .4;
            this.keyMap = {};
            this.socket = socket;
            this.x = x;  //client needs
            this.y = y;
            //start position
            this.sx = x;
            this.sy= y;  
            this.width = 30;
            this.height = this.width/2;
            this.pointoffsets = [new Point(-this.width/2,-this.height/2+5),new Point(-this.width/2,0),new Point(-this.width/2,this.height/2-5),new Point(0,this.height/2-5),new Point(this.width/2,this.height/2-5),new Point(this.width/2,0),new Point(this.width/2,-this.height/2+5),new Point(0,-this.height+5)];
            this.points = [];
            this.setPoints();
            this.vel = 0;
            this.angle = 0; //client needs
            this.stopped = false;
            this.MAXVEL = 15*this.speed;
            this.MAXTURN = Math.PI / 36 * this.rotspeed;
            this.crashed = false;
            this.travelled = 0;
            this.age = 0;
      }

      fromOrigin(){
         return Math.sqrt((this.x-this.sx)**2 + (this.y-this.sy)**2);
      }
      setPoints(){
         this.points = [];
         for(var point of this.pointoffsets){
            this.points.push(new Point(this.x+point.x,this.y+point.y));
         }
      }

      json(){
         return {'x':this.x,'y':this.y,'angle':this.angle,'id':this.id};
      }
      go(){
      	this.stopped = false;
      }

      coast(){
         if(this.vel > 0){
            this.vel -= .1 * this.speed;;
         }
         if(this.vel < 0){
            this.vel += .1 *this.speed;
         }
      }
      move(){
         this.travelled += this.vel;
         this.x += this.vel * Math.cos(this.angle);
         this.y += this.vel * Math.sin(this.angle);
         for(var point of this.points){
               point.x += this.vel * Math.cos(this.angle);
               point.y += this.vel * Math.sin(this.angle);
         }
         this.age += 1;
      }

      speedUp(){
            if(this.vel < this.MAXVEL){
                  if(this.vel < .5*this.speed){
                        this.vel += .4*this.speed;
                  } else {
                        this.vel += .2*this.speed;
                  }
            }else{
                  this.vel = this.MAXVEL;
            }
      }

      slowDown(){
            if(this.vel > -this.MAXVEL){
               this.vel -= .2*this.speed;
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
      		if(!this.stopped && this.socket){
                     this.socket.emit('crash',{});
      		}
            this.crashed = true;
            this.stopped = true;
      }

      turnRight(factor){
      		if(this.stopped || this.vel == 0){
      			return;
      		}
            var change;
            if((2+factor**2)*this.rotspeed * Math.PI/180 < this.MAXTURN){
                  change = this.rotspeed*(2+factor**2)*(Math.PI/180);
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
      	    if(this.stopped || this.vel == 0){
      	    	return;
      	    }
            var change
            if((2+factor**2)* this.rotspeed * Math.PI/180 < this.MAXTURN){
                  change = -this.rotspeed*(2+ factor**2)*(Math.PI/180);
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


module.exports =  {
   makeMap : makeMap,
   checkKeys: checkKeys,
   Car: Car,
   updateWorld: updateWorld,
   makeCar: makeCar,
   pointIn: pointIn,
   Point: Point
}
