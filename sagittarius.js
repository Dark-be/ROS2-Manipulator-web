
const { Action, ActionStates, ActionTypes } = require('./action.js');

class Sagittarius {
  constructor(node, io, actionQueue) {
    this.currentPose = { x: 0.17, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }
    this.lastPose = { x: 0.17, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }
    
    this.targetPose = { x: 0.17, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }
    this.originalPose = { x: 0.17, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }
    this.searchPose = { x: 0.22, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }

    this.actionQueue = actionQueue;
    this.actionNow = null;

    this.getTarget = false;
    this.getTargetCounter = 0;

    this.io = io;
    this.recognitionRecv = false;
    this.itemList = [];

    this.node = node;
    this.armPublisher = node.createPublisher('std_msgs/msg/Float32MultiArray', 'sagittarius/endpose');
    this.handPublisher = node.createPublisher('std_msgs/msg/Float32', 'sagittarius/endgrip');
    this.poseSubscriber = node.createSubscription('std_msgs/msg/Float32MultiArray', 'sagittarius/current_pose', (msg) => {
      this.currentPose.x = msg.data[0];
      this.currentPose.y = msg.data[1];
      this.currentPose.z = msg.data[2];
      this.currentPose.roll = msg.data[3];
      this.currentPose.pitch = msg.data[4];
      this.currentPose.yaw = msg.data[5];
      this.IsArmGetTarget(3);
      this.lastPose.x = this.currentPose.x;
      this.lastPose.y = this.currentPose.y;
      this.lastPose.z = this.currentPose.z;
      this.lastPose.roll = this.currentPose.roll;
      this.lastPose.pitch = this.currentPose.pitch;
      this.lastPose.yaw = this.currentPose.yaw;
    })
    this.MoveToPose(this.originalPose);
    console.log('Sagi: Sagittarius created');
    
  }
  IsArmGetTarget(times) {
    if(this.lastPose.x == this.currentPose.x &&
      this.lastPose.y == this.currentPose.y &&
      this.lastPose.z == this.currentPose.z &&
      this.lastPose.roll == this.currentPose.roll &&
      this.lastPose.pitch == this.currentPose.pitch &&
      this.lastPose.yaw == this.currentPose.yaw) {
      if(this.getTargetCounter < times) {
        this.getTargetCounter += 1;
      }
      if(this.getTargetCounter >= times) {
        //console.log('Sagi: Get target');
        this.getTargetCounter = 0;
        this.getTarget = true;
      }
    }
    else{
      //console.log('Sagi: Not get target');
      this.getTargetCounter = 0;
      this.getTarget = false;
    }
  }
  MoveToPose(pose) {
    this.getTargetCounter = 0;
    this.getTarget = false;
    this.targetPose.x = pose.x;
    this.targetPose.y = pose.y;
    this.targetPose.z = pose.z;
    this.targetPose.roll = pose.roll;
    this.targetPose.pitch = pose.pitch;
    this.targetPose.yaw = pose.yaw;
    this.armPublisher.publish({
      data: [pose.x, pose.y, pose.z, pose.roll, pose.pitch, pose.yaw]
    })
  }
  GripToValue(value) {
    this.handPublisher.publish({
      data: value
    })
  }

  TurnToAngle(angle){
    var distance = Math.sqrt(this.targetPose.x * this.targetPose.x + this.targetPose.y * this.targetPose.y);
    var yaw = angle;
    if(yaw < 0){ yaw += 360; }
    if(yaw > 360){ yaw -= 360; }
    this.targetPose.x = distance * Math.cos(yaw / 180 * Math.PI);
    this.targetPose.y = distance * Math.sin(yaw / 180 * Math.PI);
    this.targetPose.yaw = Math.atan2(this.targetPose.y, this.targetPose.x) * 180 / Math.PI;
    this.MoveToPose(this.targetPose);
  }

  Forward(value) {
    this.targetPose.x += value * Math.cos(this.targetPose.yaw / 180 * Math.PI);
    this.targetPose.y += value * Math.sin(this.targetPose.yaw / 180 * Math.PI);
    this.MoveToPose(this.targetPose);
  }

  CameraToArm(camPose) {
    camPose.x *= 0.8
    var yaw = this.currentPose.yaw / 180 * Math.PI;
    var x = this.currentPose.x + camPose.z * Math.cos(yaw) + camPose.x * Math.sin(yaw);
    var y = this.currentPose.y + camPose.z * Math.sin(yaw) - camPose.x * Math.cos(yaw);
    yaw = Math.atan2(y, x) * 180 / Math.PI;
    var pose = {
      x: x,
      y: y,
      z: this.currentPose.z + camPose.y,
      roll: 0,
      pitch: 0,
      yaw: yaw
    }
    return pose;
  }

  GripObject(position) {
    var tmpPose = this.CameraToArm({x: position[0] - 0.02, y: position[1] - 0.1, z: position[2] - 0.09});//水平，垂直，前后
    // this.actionQueue.push(new Action(ActionTypes.SGRIP, 0, ActionStates.WAITING));
    // this.actionQueue.push(new Action(ActionTypes.SMOVE, tmpPose, ActionStates.WAITING));
    // this.actionQueue.push(new Action(ActionTypes.SGRIP, 95, ActionStates.WAITING));
    // this.actionQueue.push(new Action(ActionTypes.SMOVE, this.originalPose, ActionStates.WAITING));
    this.actionQueue.unshift(new Action(ActionTypes.SMOVE, this.originalPose, ActionStates.WAITING));
    this.actionQueue.unshift(new Action(ActionTypes.SGRIP, 95, ActionStates.WAITING));
    this.actionQueue.unshift(new Action(ActionTypes.SFORWARD, 0.04, ActionStates.WAITING));
    this.actionQueue.unshift(new Action(ActionTypes.SMOVE, tmpPose, ActionStates.WAITING));
    this.actionQueue.unshift(new Action(ActionTypes.SGRIP, 0, ActionStates.WAITING));
  }

  //执行机构
  ActionHandler(action) {
    switch(action.type) {
      case ActionTypes.SMOVE:
        action.state = ActionStates.EXCUTING;
        this.MoveToPose(action.value);
        var interval = setInterval(() => {
          if(this.getTarget) {
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        break;

      case ActionTypes.STRANSLATE:
        action.state = ActionStates.EXCUTING;
        this.targetPose.x += action.value.x;
        this.targetPose.y += action.value.y;
        this.targetPose.z += action.value.z;
        this.MoveToPose(this.targetPose);
        var interval = setInterval(() => {
          if(this.getTarget) {
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        break;

      case ActionTypes.SROTATE:
        action.state = ActionStates.EXCUTING;
        this.targetPose.roll = action.value.roll;
        this.targetPose.pitch = action.value.pitch;
        this.MoveToPose(this.targetPose);
        var interval = setInterval(() => {
          if(this.getTarget) {
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        break;

      case ActionTypes.STURN:
        action.state = ActionStates.EXCUTING;
        this.TurnToAngle(this.targetPose.yaw + action.value);
        var interval = setInterval(() => {
          if(this.getTarget) {
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        break;

      case ActionTypes.SFORWARD:
        action.state = ActionStates.EXCUTING;
        this.Forward(action.value);
        var interval = setInterval(() => {
          if(this.getTarget) {
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        break;

      case ActionTypes.SGRIP:
        action.state = ActionStates.EXCUTING;
        action.value = parseFloat(action.value);
        this.GripToValue(action.value);
        setTimeout(() => {
          action.state = ActionStates.COMPLETED;
        }, 2000)
        break;

      case ActionTypes.SSEARCH:
        action.state = ActionStates.EXCUTING;
        console.log('Sagi: Searching:', action.value);
        var itemName = action.value;
        this.itemList = [];
        this.recognitionRecv = false;
        this.io.emit('RequestRecognition');
        //this.io.emit('Speech', '正在寻找' + itemName);
        var flag=0;
        var interval = setInterval(() => {
          if(this.recognitionRecv) {
            //console.log('Sagi: Search item:',this.itemList);
            this.itemList.some(item => {
              
              if(item['name'] == itemName) {
                flag=1;
                //this.io.emit('Speech', `找到了`);
                console.log('Sagi: Find an item:', itemName);
                if(item['position'][2] > 0.5) {
                  //this.io.emit('Speech', `物品离我太远了,我要走近点`);
                  console.log('Sagi: Item too far');
                  return false;
                }
                else {
                  //this.io.emit('Speech', '开始抓取');
                  this.GripObject(item['position']);
                  return true;
                }
                
              }
            })
            if(flag==0){
              //this.io.emit('Speech', `没有找到`);
              console.log('Sagi: Item not found');
            }
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        setTimeout(() => {
          if(this.recognitionRecv == false) {
            //this.io.emit('Speech', '我的眼睛好像出了点问题');
            console.log('Sagi: Search timeout');
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 4000)
      default:
        break;
    }
  }
  GetRecognition(recognition) {
    //console.log('Sagi: Recognition:', recognition);
    this.recognitionRecv = true;
    this.itemList = recognition;
  }
}


module.exports = {
  Sagittarius
}