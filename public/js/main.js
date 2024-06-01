var pose = {
    x: 0.17,
    y: 0,
    z: 0.19,
    roll: 0,
    pitch: 0,
    yaw: 0
};
var grip = 0;

const socket = io();
setInterval(() => {
    if(tracking){
        track(trackTarget);
    }
}, 6000);

let sendingPose = false;
let sendingGrip = false;

setInterval(() => {
    pose.roll = parseFloat(target_roll_slider.value);
    pose.pitch = parseFloat(target_pitch_slider.value);
    grip = parseInt(target_grip_slider.value);
    if(sendingPose || tracking){
        socket.emit('Pose',{
        x: pose.x,
        y: pose.y,
        z: pose.z,
        roll: pose.roll,
        pitch: pose.pitch,
        yaw: pose.yaw
        })
    }
    if(sendingGrip || tracking){
        socket.emit('Grip', grip);
    }
    dataSync();
}, 100);