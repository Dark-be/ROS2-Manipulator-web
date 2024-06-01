require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const rclnodejs = require('rclnodejs');
const e = require('express');
const { count } = require('console');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {pingInterval: 2000, pingTimeout: 5000});
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + 'public/index.html');
})

function MoveToPose(pose) {
  get_target_counter = 0;
  get_target = false;
  target_pose.x = pose.x;
  target_pose.y = pose.y;
  target_pose.z = pose.z;
  target_pose.roll = pose.roll;
  target_pose.pitch = pose.pitch;
  target_pose.yaw = pose.yaw;
  arm_publisher.publish({
    data: [pose.x, pose.y, pose.z, pose.roll, pose.pitch, pose.yaw]
  })
}
function TurnAngle(angle){
  var tmp_distance = Math.sqrt(target_pose.x * target_pose.x + target_pose.y * target_pose.y);
  var tmp_yaw = (target_pose.yaw + angle);
  if(tmp_yaw < 0){
      tmp_yaw += 360;
  }
  if(tmp_yaw > 360){
      tmp_yaw -= 360;
  }
  target_pose.x = tmp_distance * Math.cos(tmp_yaw / 180 * Math.PI);
  target_pose.y = tmp_distance * Math.sin(tmp_yaw / 180 * Math.PI);
  target_pose.yaw = Math.atan2(target_pose.y, target_pose.x) * 180 / Math.PI;
  MoveToPose(target_pose);
}
function GripToValue(value) {
  hand_publisher.publish({
    data: value
  })
}
// tool function
function CameraToArm(position) {
  var tmp_yaw = arm_pos.yaw / 180 * Math.PI;
  var tmp_x = arm_pos.x + position.z * Math.cos(tmp_yaw) + position.x * Math.sin(tmp_yaw);
  var tmp_y = arm_pos.y + position.z * Math.sin(tmp_yaw) - position.x * Math.cos(tmp_yaw);
  var next_yaw = Math.atan2(tmp_y, tmp_x) * 180 / Math.PI
  if (next_yaw < 0) {
    next_yaw += 360;
  }
  else if (next_yaw > 360) {
    next_yaw -= 360;
  }
  var tmp_pose = {
    x: tmp_x,
    y: tmp_y,
    z: arm_pos.z + position.y,
    roll: 0,
    pitch: 0,
    yaw: next_yaw
  }
  return tmp_pose;
}

var last_arm_pos = {
  x: 0,
  y: 0,
  z: 0,
  roll: 0,
  pitch: 0,
  yaw: 0
}
var get_target_counter = 0;
var get_target = false;
// 检测是否移动
function IsArmGetTarget() {
  if(last_arm_pos.x == arm_pos.x &&
    last_arm_pos.y == arm_pos.y &&
    last_arm_pos.z == arm_pos.z &&
    last_arm_pos.roll == arm_pos.roll &&
    last_arm_pos.pitch == arm_pos.pitch &&
    last_arm_pos.yaw == arm_pos.yaw) {
    if(get_target_counter < 3) {
      get_target_counter += 1;
    }
    if(get_target_counter == 3) {
      get_target_counter = 0;
      //console.log('Get target');
      get_target = true;
    }
  }
  else{
    //console.log('Not get target');
    get_target_counter = 0;
    get_target = false;
  }
  last_arm_pos = {
    x: arm_pos.x,
    y: arm_pos.y,
    z: arm_pos.z,
    roll: arm_pos.roll,
    pitch: arm_pos.pitch,
    yaw: arm_pos.yaw
  }
}

var item_list = {}
var search_task_counter = 0;
var target_item = '';
var searching = false;
var recognizing = false;
function MoveToSearch() {
  if(search_task_counter == 3) {
    search_task_counter = 0;
    //io.emit('GetSearch', false);
    return;
  }
  if(search_task_counter == 0) {
    MoveToPose(search_pose);
  }
  else if(search_task_counter == 1) {
    TurnAngle(-30);
  }
  else if(search_task_counter == 2) {
    TurnAngle(60);
  }
  else if(search_task_counter == 3) {
    TurnAngle(-90);
  }
  else if(search_task_counter == 4) {
    TurnAngle(120);
  }
  
  console.log('Search task:', search_task_counter);
  search_task_counter += 1;
}

setInterval(() => {
  if(recognizing || searching) {
    io.emit('RequestRecognition');
  }
  if(recognizing) {
    io.emit('GetRecognition', item_list);
  }
  if(searching && get_target) {
    //console.log('item_list:', item_list);
    if(item_list[target_item]) {
      console.log('Find target item:', item_list[target_item]);
      GripObject(item_list[target_item]);
      searching = false;
      io.emit('GetSearch', true);
    }
    else {
      MoveToSearch();
    }
  }
}, 500)

function GripObject(item) {
  //console.log('Now at pose: ', arm_pos);
  tmp_pose = CameraToArm({x: item[0] - 0.02, y: item[1] + 0.05, z: item[2] - 0.1});
  //console.log('Move to object pose: ', tmp_pose);
  MoveToPose(tmp_pose);
  console.log('1 Move to object');

  setTimeout(() => {
    tmp_pose = CameraToArm({x: 0, y: 0, z: 0.03});
    MoveToPose(tmp_pose);
    console.log('2 Move forward');
  }, 3000)

  setTimeout(() => {
    tmp_pose = CameraToArm({x: 0, y: 0, z: 0.02});
    MoveToPose(tmp_pose);
    console.log('3 Move closer');
  }, 4000)
  
  setTimeout(() => {
    GripToValue(50);
    console.log('4 Grip object');
  }, 5000)

  setTimeout(() => {
    MoveToPose(original_pose);
    console.log('5 Back to original pose');
    
  }, 7000)
  setTimeout(() => {
    GripToValue(0);
    console.log('6 Release object');
  }, 9000)
}

var node;
var arm_publisher;
var hand_publisher;
var pose_subscriber;

var arm_pos = {
  x: 0.17,
  y: 0,
  z: 0.19,
  roll: 0,
  pitch: 0,
  yaw: 0
}
var target_pose = {
  x: 0.17,
  y: 0,
  z: 0.19,
  roll: 0,
  pitch: 0,
  yaw: 0
}
const original_pose = {
  x: 0.17,
  y: 0,
  z: 0.19,
  roll: 0,
  pitch: 0,
  yaw: 0
}
const search_pose = {
  x: 0.22,
  y: 0,
  z: 0.19,
  roll: 0,
  pitch: 0,
  yaw: 0
}

rclnodejs.init().then(() => {
    node = new rclnodejs.Node('publisher_example_node');
    console.log(`Publisher Node created.`);
    arm_publisher = node.createPublisher('std_msgs/msg/Float32MultiArray', 'sagittarius/endpose');
    hand_publisher = node.createPublisher('std_msgs/msg/Float32', 'sagittarius/endgrip');
    pose_subscriber = node.createSubscription('std_msgs/msg/Float32MultiArray', 'sagittarius/current_pose', (msg) => {
      arm_pos.x = msg.data[0];
      arm_pos.y = msg.data[1];
      arm_pos.z = msg.data[2];
      arm_pos.roll = msg.data[3];
      arm_pos.pitch = msg.data[4];
      arm_pos.yaw = msg.data[5];
      IsArmGetTarget();
    })
    node.spin();
})

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('Pose', (msg) => {
    target_pose = {
      x: msg.x,
      y: msg.y,
      z: msg.z,
      roll: msg.roll,
      pitch: msg.pitch,
      yaw: msg.yaw
    }
    console.log('Move to', target_pose);
    console.log('Current Pose: ', arm_pos);
    MoveToPose(target_pose);
  })
  socket.on('Grip', (msg) => {
    console.log('Grip to', msg);
    GripToValue(msg);
  })

  socket.on('Search', (msg) => {
    target_item = msg;
    if(msg == 'stop') {
      searching = false;
      io.emit('GetSearch', false);
    }
    else {
      searching = true;
      console.log('Searching object:', target_item);
    }
    
  })

  socket.on('RecvRecognition', (msg) => {
    item_list = msg;
  })

  socket.on('GetRecognition', (msg) => {
    recognizing = msg;
  })
})

server.listen(port, () => {
  console.log(`Listening on *:${port}`);
})

