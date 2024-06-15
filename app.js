require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {pingInterval: 2000, pingTimeout: 5000});
const port = 3000;

const rclnodejs = require('rclnodejs');
const Action = require('./action.js');
const Sagittarius = require('./sagittarius.js');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + 'public/index.html');
})
app.get('/api/get-chat-token', (req, res) => {
  res.json({
    key: process.env.CHAT_KEY,
    url: process.env.CHAT_BASE_URL
  });
})

app.get('/api/get-speech-token', (req, res) => {
  res.json({
    key: process.env.SPEECH_KEY,
    region: process.env.SPEECH_REGION
  });
})

var sagittarius = null;
rclnodejs.init().then(() => {
  node = new rclnodejs.Node('publisher_example_node');
  console.log(`ROS2 Node { Web Controller } created`);
  sagittarius = new Sagittarius.Sagittarius(node, io); 
  node.spin();
})


setInterval(() => {
  io.emit('PoseUpdate', sagittarius.targetPose);
}, 200)

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('SagittariusAction', (msg) => {
    var action = new Action.Action(msg.type, msg.value, Sagittarius.ActionStates.WAITING);
    console.log('Recv arm action:', action);
    sagittarius.AddAction(action);
  })

  socket.on('RecvRecognition', (msg) => {
    sagittarius.GetRecognition(msg);
  })

  socket.on('GetRecognition', () => {
    io.emit('RequestRecognition');
  })

  socket.on('GetImage', () => {
    io.emit('RequestImage');
  })

  socket.on('RecvImage', (msg) => {
    io.emit('Image', msg);
  })
})

server.listen(port, () => {
  console.log(`Listening on localhost:${port}`);
})
