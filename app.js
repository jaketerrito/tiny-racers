var express = require('express');
var app = express();
var serv = require('http').Server(app);
var gameObjects = require('./gameObjects.js');
var aiObjects = require('./aiObjects.js');
var spawn = require('child_process').spawn;
var glob = require("glob");

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/tinyRacers.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

var io = require('socket.io')(serv,{});

var objects = []
gameObjects.makeMap(objects)
var objectList = [];
for(thing of objects){
   objectList.push(thing.points);
}
var cars = []
var carList = [];
var comps = [];
io.on('connection',function(socket){
   //console.log("A user connected: " + socket.id);
   socket.on('disconnect',onClientDisconnect);
   var car = new gameObjects.makeCar(cars,socket.id,socket);
   cars.push(car);
   carList.push(car.json());
   socket.emit('initialize',{'objects':objectList,'cars':carList});
   //socket.emit('initialize',carList);
   socket.on('keyDown', function (data) {
      car.keyMap[data] = 1;
   });
   socket.on('keyUp', function (data) {
      car.lastMove = new Date().getTime();
      car.keyMap[data] = 0;
   });
});

function onClientDisconnect(data){
   //console.log("player disconnected: " + this.id);
   var toRemove = removeCar(this.id);
   if(toRemove){
      cars.splice(cars.indexOf(toRemove),1);
   }else{
      //console.log('attempting to remove nonexistant player');
   }
}
var tickLength = Math.floor(1000/240);//fps

function removeCar(id){
   for(car of cars){
      if(car.id == id){
         return car;
      }
   }
   return null;
}


var count = 0;
var ai_configs = null;

gameLoop = () => {
   var startTime = new Date().getTime();
   var tempList = [];
   var crashed = [];
   carList = gameObjects.updateWorld(cars,objects);
   io.sockets.emit('update',{'cars':carList});         
   for(var i = comps.length-1; i >= 0; i--){
      if(comps[i].car.crashed || startTime - comps[i].car.lastMove > 45000){
         comps[i].score();
         cars.splice(cars.indexOf(comps[i].car),1);
         comps[i].setCar(new gameObjects.makeCar(cars,Math.random() * 1000));
         cars.push(comps[i].car);  
      }
      comps[i].score();
      comps[i].updateDistances(objects, cars); //automatically make's move based off nn response
   }
}
var AI = new aiObjects.AI(new gameObjects.makeCar(cars,Math.random() * 1000),'None', gameLoop);
cars.push(AI.car);
comps.push(AI);
gameLoop();


//GAMELOOP CALLBACK OFROM updateDistances