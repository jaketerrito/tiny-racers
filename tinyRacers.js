//Program3
//CSC 378
//Jacob Territo
var tickLength = Math.floor(1000/60);
function getCar(search,cars){
   for(car of cars){
      if(car.id == search.id){
         return car;
      }
   }
   return null;
}

function updateWorld(cars,objects){
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
                     }
                     if(key == 40){
                           car.slowDown();
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

      var shape = new Collidable(1);
      shape.points = [new Point(0,0), new Point(1000,0), new Point(1000,750), new Point(0,750),new Point(0,20),new Point(20,20),new Point(20,730),new Point(980,730),new Point(980,20),new Point(0,20)];
      objects.push(shape);
      shape = new Polygon(100,100,1,4);      
      objects.push(shape);
      shape = new Collidable(1);
      shape.points = [new Point(142,247),new Point(142,227),new Point(168,203),new Point(195,201),new Point(332,201),new Point(386,190),new Point(441,149),new Point(474,124),new Point(502,124),new Point(542,156),new Point(590,186),new Point(641,201),new Point(801,201),new Point(815,208),new Point(834,226),new Point(835,553),new Point(825,577),new Point(791,593),new Point(186,592),new Point(152,578),new Point(140,554),new Point(155,530),new Point(177,515),new Point(537,518),new Point(576,509),new Point(620,483),new Point(657,433),new Point(666,394),new Point(658,358),new Point(640,326),new Point(608,297),new Point(569,278),new Point(532,274),new Point(187,276),new Point(159,267)];
      objects.push(shape);
      shape = new Collidable(1);
      shape.points = [new Point(47,237),new Point(57,275),new Point(73,309),new Point(122,347),new Point(170,360),new Point(531,359),new Point(558,370),new Point(573,391),new Point(572,404),new Point(558,424),new Point(538,433),new Point(183,431),new Point(142,436),new Point(106,455),new Point(77,482),new Point(56,515),new Point(48,552)];
      objects.push(shape);
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
   var spots = [[100,100],[200,100],[300,100],[400,100]];
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
            this.speed = .5;
            this.rotspeed = .5;
            this.keyMap = {};
            this.socket = socket;
            this.x = x;  //client needs
            this.y = y;  //client needs
            this.width = 40;
            this.height = this.width/2;
            this.pointoffsets = [new Point(-this.width/2,-this.height/2+5),new Point(-this.width/2,0),new Point(-this.width/2,this.height/2-5),new Point(0,this.height/2-5),new Point(this.width/2,this.height/2-5),new Point(this.width/2,0),new Point(this.width/2,-this.height/2+5),new Point(0,-this.height+5)];
            this.points = [];
            this.setPoints();
            this.vel = 0;
            this.angle = 0; //client needs
            this.stopped = false;
            this.MAXVEL = 12*this.speed;
            this.MAXTURN = Math.PI / 4 * this.rotspeed;
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
                  if(this.vel > -.5*this.speed){
                        this.vel -= .4*this.speed;
                  } else {
                        this.vel -= .2*this.speed;
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
                     this.socket.emit('crash',{});
      		}
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
   makeCar: makeCar


}
