var express = require('express');
var app = express();
var serv = require('http').Server(app);
var gameObjects = require('./tinyRacers.js');
var aiObjects = require('./aiObjects.js');

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/tinyRacers.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

var io = require('socket.io')(serv,{});

var objects = []
gameObjects.makeMap(objects)
//var objectList = [];
//for(thing of objects){
//   objectList.push(thing.points);
//}
var cars = []
var carList = [];
var comps = [];
io.on('connection',function(socket){
   //console.log("A user connected: " + socket.id);
   socket.on('disconnect',onClientDisconnect);
   var car = new gameObjects.makeCar(cars,socket.id,socket);
   cars.push(car);
   carList.push(car.json());
   //socket.emit('initialize',{'objects':objectList,'cars':carList});
   socket.emit('initialize',carList);
   socket.on('keyDown', function (data) {
      car.keyMap[data] = 1;
   });
   socket.on('keyUp', function (data) {
      if(data == 80){
         var AI = new aiObjects.AI(new gameObjects.makeCar(cars,Math.random() * 1000,null));
         cars.push(AI.car);
         comps.push(AI);
      }
      car.lastMove = new Date().getTime();
      car.keyMap[data] = 0;
   });
});

function onClientDisconnect(data){
   //console.log("player disconnected: " + this.id);
   var toRemove = removeCar(this.id);
   console.log(toRemove.travelled);
   if(toRemove){
      cars.splice(cars.indexOf(toRemove),1);
   }else{
      //console.log('attempting to remove nonexistant player');
   }
}
var tickLength = Math.floor(1000/60);

function removeCar(id){
   for(car of cars){
      if(car.id == id){
         return car;
      }
   }
   return null;
}

function gameLoop(){
   var startTime = new Date().getTime();
   var tempList = [];
   var crashed = [];
   carList = gameObjects.updateWorld(cars,objects);
   io.sockets.emit('update',{'cars':carList});
   var tickTime = new Date().getTime() - startTime;
   if(tickTime < 0){
      tickTime = 0;
   }
   if(tickTime > tickLength){
      console.log("dropping frame");
      setTimeout(gameLoop,(Math.floor(tickTime/tickLength)+1)*tickLength-tickTime);
   }else{
      setTimeout(gameLoop,tickLength-tickTime);
   }
   if(comps.length < 1){
      var AI = new aiObjects.AI(new gameObjects.makeCar(cars,Math.random() * 1000,null));
      cars.push(AI.car);
      comps.push(AI);
   }

   for(var i = comps.length-1; i >= 0; i--){
      if(comps[i].car.crashed || startTime - comps[i].car.lastMove > 20000){
         comps[i].score();
         cars.splice(cars.indexOf(comps[i].car),1);
         comps.splice(i,1);
         continue;
      }
      comps[i].updateDistances(objects, cars); //automatically make's move based off nn response
   }
}
gameLoop();
