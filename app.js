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
io.on('connection',function(socket){
   //console.log("A user connected: " + socket.id);
   socket.on('disconnect',onClientDisconnect);
   var car = new gameObjects.makeCar(socket.id,socket);
   cars.push(car);
   carList.push(car.json());
   socket.emit('initialize',{'objects':objectList,'cars':carList});
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

function removeCar(id){
   for(car of cars){
      if(car.id == id){
         return car;
      }
   }
   return null;
}

var start = new Date().getTime();
gameLoop = async () => {
   var tempList = [];
   var crashed = [];
   carList = gameObjects.updateWorld(cars,objects);
   io.sockets.emit('update',{'cars':carList});
   await AI.score();  
   if(AI.car.crashed){
      cars.splice(cars.indexOf(AI.car),1);
      AI.setCar(new gameObjects.makeCar(69,null));
      cars.push(AI.car);  
      start = new Date().getTime();
   }
   AI.updateDistances(objects, cars); //automatically make's move based off nn response
}
var AI = new aiObjects.AI(new gameObjects.makeCar(69,null), gameLoop);
cars.push(AI.car);
//GAMELOOP CALLBACK OFROM updateDistances
gameLoop();


