var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/tinyRacers.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

var io = require('socket.io')(serv,{});

function crashed(data){
   console.log(data.message);
}

io.on('connection',function(socket){
   console.log("A user connected");
   socket.on('crashed',crashed);
});


