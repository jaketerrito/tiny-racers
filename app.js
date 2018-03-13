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
var cars = []
var carList = [];

io.on('connection',function(socket){
   console.log("A user connected");
   var car = new gameObjects.Car(100,100,socket.id,socket);
   cars.push(car);
   socket.emit('initialize',{'objects':objects,'cars':carList});
   socket.on('keyDown', function (data) {
       car.keyMap[data] = 1;
       console.log("YA PRESSED A BUTTON");
   });
   socket.on('keyUp', function (data) {
       car.keyMap[data] = 0;
   });
   console.log(cars);
});
function carList(){
   var list = [];
}
function gameLoop(){
   setTimeout(gameLoop,100);
   tempList = [];
   for(car of cars){
      gameObjects.checkKeys(car);
      car.move();
      if(car.checkCollision(objects) || car.checkCollision(cars)){
         car.crash();
      }
      tempList.push(car.json());
   }
   carList = tempList
   io.sockets.emit('update',{'cars':carList});
   gameObjects.checkKeys();
}