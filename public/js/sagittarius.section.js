const target_x_element = document.getElementById('target_x');
const target_y_element = document.getElementById('target_y');
const target_z_element = document.getElementById('target_z');
const target_roll_element = document.getElementById('target_roll');
const target_pitch_element = document.getElementById('target_pitch');
const target_yaw_element = document.getElementById('target_yaw');
const target_grip_element = document.getElementById('target_grip');

function dataSync(){
    target_x_element.innerText = pose.x.toFixed(3);
    target_y_element.innerText = pose.y.toFixed(3);
    target_z_element.innerText = pose.z.toFixed(3);
    target_roll_element.innerText = pose.roll.toFixed(3);
    target_pitch_element.innerText = pose.pitch.toFixed(3);
    target_yaw_element.innerText = pose.yaw.toFixed(3);
    target_grip_element.innerText = grip;
}

const up_bt = document.getElementById('up');
const down_bt = document.getElementById('down');
const left_bt = document.getElementById('left');
const right_bt = document.getElementById('right');
const forward_bt = document.getElementById('forward');
const backward_bt = document.getElementById('backward');

const reset_bt = document.getElementById('reset');
const send_bt = document.getElementById('send');

const target_roll_slider = document.getElementById('target_roll_slider');
const target_pitch_slider = document.getElementById('target_pitch_slider');
const target_grip_slider = document.getElementById('target_grip_slider');

const accuracy_element = document.getElementById('accuracy');
var accuracy = 0.01;
accuracy_element.addEventListener('input', function() {
    accuracy = parseFloat(this.value);
    if (!isNaN(accuracy)) {
        console.log('Accuracy:', accuracy);
    } else {
        this.value = 0;
        accuracy = 0;
        console.log('Invalid Accuracy');
    }
})

target_grip_slider.addEventListener('change', function() {
    actionNow = new Action('grip', parseInt(this.value));
})

target_roll_slider.addEventListener('change', function() {
    actionNow = new Action('rotate', { roll: parseInt(this.value), pitch: 0 });
})
target_pitch_slider.addEventListener('change', function() {
    actionNow = new Action('rotate', { roll: 0, pitch: parseInt(this.value) });
})

up_bt.addEventListener('click', () => {
    actionNow = new Action('translate', { x: 0, y: 0, z: accuracy });
})
down_bt.addEventListener('click', () => {
    actionNow = new Action('translate', { x: 0, y: 0, z: -accuracy });
})
left_bt.addEventListener('click', () => {
    actionNow = new Action('turn', accuracy * 500);
})
right_bt.addEventListener('click', () => {
    actionNow = new Action('turn', -accuracy * 500);
})
forward_bt.addEventListener('click', () => {
    actionNow = new Action('forward', accuracy);
})
backward_bt.addEventListener('click', () => {
    actionNow = new Action('forward', -accuracy);
})
reset_bt.addEventListener('click', () => {
    var tmpPose = {
        x: 0.17,
        y: 0,
        z: 0.19,
        roll: 0,
        pitch: 0,
        yaw: 0
    }
    actionNow = new Action('move', tmpPose);
})
send_bt.addEventListener('click', () => {
    if(sendingGrip == false && sendingPose == false){
        sendingPose = true;
        sendingGrip = true;
        send_bt.style.backgroundColor = "#80F080";
        console.log('Sending Pose and Grip');
    }
    else{
        sendingPose = false;
        sendingGrip = false;
        send_bt.style.backgroundColor = 'white';
        console.log('Stop Sending Pose and Grip');
    }
})