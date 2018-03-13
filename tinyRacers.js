//Program3
//CSC 378
//Jacob Territo

function checkKeys(car){
      for(var key in keyMap){
               if(keyMap[key] > 0){
                     keyMap[key]+= 1/30;
                     if(key == 38){
                           car.speedUp();
                     }
                     if(key == 40){
                           car.slowDown();
                     }  
                     if(key == 37){
                           car.turnLeft(keyMap[key]);
                     }
                     if(key == 39){
                           car.turnRight(keyMap[key]);
                     }
                     if(key == 32){
                           car.stop();
                     }
               }
        }
}

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
      constructor(x,y,id,socket){
            super(id);
            this.keyMap = {};
            this.socket = socket;
            this.x = x;  //client needs
            this.y = y;  //client needs
            this.width = 60;
            this.height = this.width/2;
            this.points = [new Point(this.x-this.width/2,this.y-this.height/2+5),new Point(this.x-this.width/2,this.y+this.height/2-5),new Point(this.x+this.width/2,this.y+this.height/2-5),new Point(this.x+this.width/2,this.y-this.height/2+5)]
            this.pointoffsets = [new Point(-this.width/2,-this.height/2+5),new Point(-this.width/2,this.height/2-5),new Point(this.width/2,this.height/2-5),new Point(this.width/2,-this.height/2+5)]
            this.vel = 0;
            this.angle = 0; //client needs
            this.stopped = false;
            this.MAXVEL = 12;
            this.MAXTURN = Math.PI / 4;
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
                     socket.emit('crash',{});
      		}
            this.stopped = true;
      }

      turnRight(factor){
      		if(this.stopped || this.vel == 0){
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
      	    if(this.stopped || this.vel == 0){
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


module.exports =  {
   makeMap : makeMap,
   checkKeys: checkKeys,
   Car: Car


}
