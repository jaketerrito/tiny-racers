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
