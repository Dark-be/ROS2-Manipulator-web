var pose = { x: 0.17, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 };
var grip = 0;

const socket = io();

socket.on('PoseUpdate', (data) => {
  pose = data;
  dataSync();
});

let sendingPose = false;
let sendingGrip = false;
var actionNow = new Action('None', 0);

setInterval(() => {
  pose.roll = parseFloat(target_roll_slider.value);
  pose.pitch = parseFloat(target_pitch_slider.value);
  grip = parseInt(target_grip_slider.value);
  if(sendingPose || sendingGrip){
    if(actionNow.type != 'None'){
      socket.emit('SagittariusAction', actionNow);
      console.log('Action:', actionNow);
      actionNow = new Action('None', 0);
    }
  }
  dataSync();
}, 100);