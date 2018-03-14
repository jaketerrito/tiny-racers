var express = require('express');
var app = express();
var serv = require('http').Server(app);
var gameObjects = require('./tinyRacers.js');
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
   objectList.push({'x':thing.x,'y':thing.y,'r':thing.r,'sides':thing.sides});

}
var cars = []
var carList = [];

io.on('connection',function(socket){
   console.log("A user connected: " + socket.id);
   socket.on('disconnect',onClientDisconnect);
   var car = new gameObjects.Car(100,100,socket.id,socket);
   cars.push(car);
   console.log(car.id);
   carList.push(car.json());
   socket.emit('initialize',{'objects':objects,'cars':carList});
   socket.on('keyDown', function (data) {
      console.log('running');
      car.keyMap[data] = 1;
   });
   socket.on('keyUp', function (data) {
       car.keyMap[data] = 0;
   });
});

function onClientDisconnect(data){
   console.log("player disconnected: " + this.id);
   var toRemove = removeCar(this.id);
   if(toRemove){
      cars.splice(cars.indexOf(toRemove),1);
   }else{
      console.log('attempting to remove nonexistant player');
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
   carList = gameObjects.carCollisions(cars,objects);
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
}
gameLoop();
