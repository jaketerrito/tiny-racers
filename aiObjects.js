var gameObjects = require('./tinyRacers.js');
var spawn = require('child_process').spawn;

class AI {
   constructor(car,cfg='NN/test.cfg'){
      this.car = car;
      this.views = 12;
      this.distances = [];
      for(var i = 0; i < this.views; i++){
         this.distances.push(500);
      }
      this.py = spawn('python3',['./NN/Run.py',cfg]);
      this.py.stdout.on('data', function(data){
         this.makeMove(data);
      }.bind(this));
      this.py.stderr.on('data',function(data){
         console.log("ERROR:" + data.toString());
      });
   }
   
   score(){
      var score = this.car.fromOrigin() * Math.log(this.car.travelled/this.car.age+1);
      if(this.car.crashed){
         score = score * .75;
      }
      if(isNaN(score)){
         score = -1000;
      }
      this.py.stdin.end("score " + score +"," + this.car.fromOrigin() + "," + this.car.age);
   }

   makeMove(data){
      var results = data.toString().split(/,|\[|\]| |\n/).filter(Boolean).map(Number);
      var thresh = .5
      if(results[0] > thresh){
         this.car.speedUp();
      }
      if(results[1] > thresh){
         this.car.slowDown(); 
      }
      if(results[2] > thresh){
         this.car.turnLeft(.1);
      }
      if(results[3] > thresh){
         this.car.turnRight(.1);
      }
      return;
      for(var distance of this.distances){
         if(distance < 50 && this.car.vel**2 > 4){
            this.car.stop();
         }
      }
      if(this.distances[0] > 50){
         this.car.speedUp();
      } else {
         this.car.slowDown();
      }
      var turn = Math.random() * 2 - 1;
      if(turn > 0){
         this.car.turnLeft(turn);
      } else{
         this.car.turnRight(turn);
      }
   }

   updateDistances(objects,cars){
      var angle = this.car.angle;
      var angles = [];
      var step = Math.PI * 2 / this.views;
      for(var i = 0; i < this.views; i++){
         angles.push(angle + step * i);
         this.distances[i] = 500;
      }
      for(var i = 0; i < angles.length; i++){
         var point = new gameObjects.Point(this.car.x, this.car.y);
         var d = 0;
         //temp point
         var interval = 1;
         var done = false
         while(!done){
            d +=  interval;
            point.x += interval * Math.cos(angles[i]);
            point.y += interval * Math.sin(angles[i]);
            for(var collidable of objects){
               if(gameObjects.pointIn(collidable.points,point)){
                  done = true;
               }
            }
            for(var collidable of cars){
               if(this.car.id != collidable.id && gameObjects.pointIn(collidable.points,point)){
                  done = true;
               }
            }
            this.distances[i] = d;
            if(d > 500){
               done = true;
            }
         }
      }
      this.py.stdin.write("[");
      for(var i = 0; i < this.distances.length; i ++){
         this.py.stdin.write("[" + this.distances[i] + "]");
         this.py.stdin.write(',');
      }
      this.py.stdin.write("[" + this.car.vel + "]");
      this.py.stdin.write("]\n");
      //NN needs input of size = this.views + 1 (for vel)
   }
}

module.exports = {
   AI : AI
}
