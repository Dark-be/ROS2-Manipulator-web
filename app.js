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
const { Action, ActionStates, ActionTypes} = require('./action.js');
const { Sagittarius } = require('./sagittarius.js');
const { Response } = require('./voice.js');
const { Unitree_Go1 } = require('./unitree.js');
const { ConsoleLoggingListener } = require('microsoft-cognitiveservices-speech-sdk/distrib/lib/src/common.browser/ConsoleLoggingListener.js');



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
const actionQueue = [];
var sagittarius = null;
var unitree_go1 = null;
rclnodejs.init().then(() => {
  node = new rclnodejs.Node('publisher_example_node');
  console.log(`ROS2 Node { Web Controller } created`);
  sagittarius = new Sagittarius(node, io, actionQueue);
  unitree_go1 = new Unitree_Go1(node, io);
  wheeltecSubscriber = node.createSubscription('std_msgs/msg/String', 'voice_words', (msg) => {
    var command = msg.data;
    console.log('Wheeltec:', msg.data);
    DoCommand(command);
    
    //io.emit("Speech", Response(msg.data));
  })
  angleSubscriber = node.createSubscription('std_msgs/msg/UInt32', 'awake_angle', (msg) => {
    var angle = msg.data - 100;
    console.log('Angle:', angle);
  })
  node.spin();
})


setInterval(() => {
  io.emit('PoseUpdate', sagittarius.targetPose);
}, 200)


var actionNow = null;
setInterval(() => {
  if(actionNow == null) {
    if(actionQueue.length == 0) {
      return;
    }
    actionNow = actionQueue.shift();
  }
  if(actionNow.state == ActionStates.WAITING) {
    console.log('Action excute:', actionNow);
    sagittarius.ActionHandler(actionNow);
    unitree_go1.ActionHandler(actionNow);
  }
  else if(actionNow.state == ActionStates.EXCUTING) {
    return;
  }
  else if(actionNow.state == ActionStates.COMPLETED) {
    actionNow = null;
  }
}, 100)

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('SagittariusAction', (msg) => {
    var action = new Action('s' + msg.type, msg.value, ActionStates.WAITING);
    //console.log('Recv arm action:', action);
    actionQueue.push(action);
  })
  socket.on('UnitreeAction', (msg) => {
    var action = new Action('u' + msg.type, msg.value, ActionStates.WAITING);
    //console.log('Recv unitree action:', action);
    actionQueue.push(action);
  })

  socket.on('RecvRecognition', (msg) => {
    sagittarius.GetRecognition(msg);
    unitree_go1.GetRecognition(msg);
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

  socket.on('AIResponse', (msg) => {
    console.log('AI Response:', msg);
    //io.emit('Speech', msg);
  })

})

function DoCommand(command) {
  if(command == '小狗前进') {
    actionQueue.push(new Action(ActionTypes.UFORWARD, 0.9, ActionStates.WAITING));
  }
  else if(command == '小狗后退') {
    actionQueue.push(new Action(ActionTypes.UFORWARD, -0.9, ActionStates.WAITING));
  }
  else if(command == '小狗左转') {
    actionQueue.push(new Action(ActionTypes.UTURN, 30, ActionStates.WAITING));
  }
  else if(command == '小狗右转') {
    actionQueue.push(new Action(ActionTypes.UTURN, -30, ActionStates.WAITING));
  }
  else if(command == '帮我拿个瓶子') {
    actionQueue.push(new Action(ActionTypes.SMOVE, {
      x: 0.22,
      y: 0.0,
      z: 0.19,
      roll: 0,
      pitch: 0,
      yaw: 0
    }, ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.UFORWARD, 1.8, ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.SMOVE, {
      x: 0.183851,
      y: -0.154269,
      z: 0.19,
      roll: 0,
      pitch: 0,
      yaw: -40
    }, ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.SSEARCH, 'bottle', ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.SMOVE, {
      x: 0.17,
      y: 0.0,
      z: 0.19,
      roll: 0,
      pitch: 0,
      yaw: -40
    }, ActionStates.WAITING));
    //调头
    actionQueue.push(new Action(ActionTypes.UTURN, 170, ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.UFORWARD, 1.8, ActionStates.WAITING));
    //松手
    actionQueue.push(new Action(ActionTypes.SGRIP, 0, ActionStates.WAITING));
  }
  else if(command == '帮我扔掉瓶子') {
    //张开手
    actionQueue.push(new Action(ActionTypes.SGRIP, 0, ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.SGRIP, 95, ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.UTURN, -90, ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.UFORWARD, 0.9, ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.SMOVE, {
      x: 0.183851,
      y: -0.154269,
      z: 0.19,
      roll: 0,
      pitch: 0,
      yaw: -40
    }, ActionStates.WAITING));
    actionQueue.push(new Action(ActionTypes.SGRIP, 0, ActionStates.WAITING));
  }
}


server.listen(port, () => {
  console.log(`Listening on localhost:${port}`);
})
