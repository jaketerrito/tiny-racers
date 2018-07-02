var gameObjects = require('./tinyRacers.js');

class AI {
   constructor(car){
      this.car = car;
      this.views = 12;
      this.distances = [];
      for(var i = 0; i < this.views; i++){
         this.distances.push(500);
      }
   }

   makeMove(){
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
      var turn = Math.random() - .5;
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
   }
}

module.exports = {
   AI : AI
}
