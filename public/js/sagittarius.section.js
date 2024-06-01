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
    
});

function TurnAngle(angle){
    var tmp_distance = Math.sqrt(pose.x * pose.x + pose.y * pose.y);
    var tmp_yaw = (pose.yaw + angle);
    if(tmp_yaw < 0){
        tmp_yaw += 360;
    }
    if(tmp_yaw > 360){
        tmp_yaw -= 360;
    }
    console.log('Yaw:', tmp_yaw);
    pose.x = tmp_distance * Math.cos(tmp_yaw / 180 * Math.PI);
    pose.y = tmp_distance * Math.sin(tmp_yaw / 180 * Math.PI);
    pose.yaw = CalYaw(pose.x, pose.y);
}
function Forward(distance){
    pose.x += distance * Math.cos(pose.yaw / 180 * Math.PI);
    pose.y -= distance * Math.sin(pose.yaw / 180 * Math.PI);
}
function CalYaw(x, y){
    var tmp_yaw = Math.atan2(y, x) * 180 / Math.PI;

    return tmp_yaw;
}
up_bt.addEventListener('click', () => {
    pose.z += accuracy;
})
down_bt.addEventListener('click', () => {
    pose.z -= accuracy;
})
left_bt.addEventListener('click', () => {
    TurnAngle(-500 * accuracy);
})
right_bt.addEventListener('click', () => {
    TurnAngle(500 * accuracy);
})
forward_bt.addEventListener('click', () => {
    Forward(accuracy);
})
backward_bt.addEventListener('click', () => {
    Forward(-accuracy);
})
reset_bt.addEventListener('click', () => {
    pose.x = 0.17;
    pose.y = 0;
    pose.z = 0.19;
    pose.roll = 0;
    pose.pitch = 0;
    pose.yaw = 0;
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