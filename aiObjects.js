var gameObjects = require('./gameObjects.js');
var spawn = require('child_process').spawn;

class AI {
   constructor(car, callback, cfg='None'){
      this.car = car;
      this.last_travelled = 0;
      this.views = 24;
      this.distances = [];
      this.max_distance = 1000;

      for(var i = 0; i < this.views; i++){
         this.distances.push(this.max_distance);
      }
      this.callback = callback
      this.data_handler = (data) => {
         this.makeMove(data);
      }
      this.py = spawn('python3',['LearningAgent.py',cfg]);
      this.py.stdout.on('data', this.data_handler);
      this.py.stderr.on('data',function(data){
         console.log(data.toString());
      });
   }

   setCar(car){
      this.car = car;
      this.distances = [];
      for(var i = 0; i < this.views; i++){
         this.distances.push(500);
      }
      this.py.stdout.removeListener('data', this.data_handler);
      this.data_handler = (data) => {
         this.makeMove(data);
      }
      this.py.stdout.on('data', this.data_handler);
   }
   
   score(score=0){
      if(this.car.fromVisited().filter((x) => {return x < 50}).length == 0 && this.car.travelled > 0){
         score = 1;
         this.car.visit();
      }
      if(this.car.crashed){
         score = -1;
      }
      this.py.stdin.write("score " + score +"," + this.car.travelled + "," + this.car.age + '\n');
   }

   makeMove(data){
      switch(parseInt(data.toString())){
         case 0:
            this.car.speedUp();
            break;
         case 1:
            this.car.slowDown();
            break;
         case 2:
            this.car.slowDown();
            this.car.turnRight(.1); 
            break;
         case 3:
            this.car.turnLeft(.1);
            this.car.speedUp();
            break;
         case 4:
            this.car.turnRight(.1);
            this.car.speedUp();
            break;
         case 5:
            this.car.slowDown();
            this.car.turnLeft(.1);
            break;
         case 6:
            this.car.turnLeft(.1);
            break;
         case 7:
            this.car.turnRight(.1);
            break;
         case 8:
            break;
         default:
            console.log("ERROR!!!!")
            exit()
      }
      this.callback();
   }

   updateDistances(objects,cars){
      var angle = this.car.angle;
      var angles = [];
      var step = Math.PI * 2 / this.views;
      for(var i = 0; i < this.views; i++){
         angles.push(angle + step * i);
         this.distances[i] = 1;
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
            this.distances[i] = d/this.max_distance;
            if(d > this.max_distance){
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
