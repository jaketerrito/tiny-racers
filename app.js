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
   console.log("A user connected");
   var car = new gameObjects.Car(100,100,socket.id,socket);
   cars.push(car);
   carList.push(car.json());
   socket.emit('initialize',{'objects':objects,'cars':carList});
   socket.on('keyDown', function (data) {
       car.keyMap[data] = 1;
       console.log("YA PRESSED A BUTTON");
   });
   socket.on('keyUp', function (data) {
       car.keyMap[data] = 0;
   });
}); 
function gameLoop(){
   setTimeout(gameLoop,50);
   var tempList = [];
   for(car of cars){
      gameObjects.checkKeys(car);
      if(car.checkCollision(cars)){
         car.crash();
      }
      car.move();
      tempList.push(car.json());
   }
   for(thing of objects){
      var collide = thing.checkCollision(cars);
      if(collide){
         collide.crash();
         console.log("ya crashed");
      }
   }
   carList = tempList.slice();
   io.sockets.emit('update',{'cars':carList});
}
gameLoop();
