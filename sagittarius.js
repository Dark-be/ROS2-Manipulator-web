
const { Action } = require('./action.js');

class Sagittarius {
  constructor(node, io) {
    this.currentPose = { x: 0.17, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }
    this.lastPose = { x: 0.17, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }
    this.targetPose = { x: 0.17, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }
    this.originalPose = { x: 0.17, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }
    this.searchPose = { x: 0.22, y: 0, z: 0.19, roll: 0, pitch: 0, yaw: 0 }

    this.actionQueue = [];
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
      this.IsArmGetTarget(5);
      this.lastPose.x = this.currentPose.x;
      this.lastPose.y = this.currentPose.y;
      this.lastPose.z = this.currentPose.z;
      this.lastPose.roll = this.currentPose.roll;
      this.lastPose.pitch = this.currentPose.pitch;
      this.lastPose.yaw = this.currentPose.yaw;
    })
    setInterval(() => {
      this.ActionHandler();
    }, 200)
    setTimeout(() => {
      this.MoveToPose(this.originalPose);
      console.log('Sagi: Sagittarius created');
    }, 500)
    
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
    var tmpPose = this.CameraToArm({x: position[0] - 0.02, y: position[1] + 0.05, z: position[2] - 0.11});//水平，垂直，前后
    this.AddAction(new Action(ActionTypes.GRIP, 0));
    this.AddAction(new Action(ActionTypes.MOVE, tmpPose));
    this.AddAction(new Action(ActionTypes.FORWARD, 0.03));
    this.AddAction(new Action(ActionTypes.FORWARD, 0.02));
    this.AddAction(new Action(ActionTypes.GRIP, 50));
    this.AddAction(new Action(ActionTypes.MOVE, this.originalPose));
    this.AddAction(new Action(ActionTypes.GRIP, 0));
  }
  AddAction(action) {
    this.actionQueue.push(action);
  }
  //执行机构
  ActionHandler() {
    if(this.actionNow != null && this.actionNow.state == ActionStates.EXCUTING) {
      console.log('Sagi: Sagittarius busy now in excuting action:', this.actionNow);
      return
    }
    if(this.actionQueue.length > 0) {
      this.actionNow = this.actionQueue.shift();
    }
    else { return }

    console.log('Sagi: Action:', this.actionNow);
    var action = this.actionNow;
    
    switch(action.type) {
      case ActionTypes.MOVE:
        action.state = ActionStates.EXCUTING;
        this.MoveToPose(action.value);
        var interval = setInterval(() => {
          if(this.getTarget) {
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        break;

      case ActionTypes.TRANSLATE:
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

      case ActionTypes.ROTATE:
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

      case ActionTypes.TURN:
        action.state = ActionStates.EXCUTING;
        this.TurnToAngle(this.targetPose.yaw + action.value);
        var interval = setInterval(() => {
          if(this.getTarget) {
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        break;

      case ActionTypes.FORWARD:
        action.state = ActionStates.EXCUTING;
        this.Forward(action.value);
        var interval = setInterval(() => {
          if(this.getTarget) {
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        break;

      case ActionTypes.GRIP:
        action.state = ActionStates.EXCUTING;
        action.value = parseFloat(action.value);
        this.GripToValue(action.value);
        setTimeout(() => {
          action.state = ActionStates.COMPLETED;
        }, 1500)
        break;

      case ActionTypes.SEARCH:
        action.state = ActionStates.EXCUTING;
        console.log('Sagi: Searching:', action.value);
        var itemName = action.value;
        this.itemList = [];
        this.recognitionRecv = false;
        this.io.emit('RequestRecognition');
        
        var interval = setInterval(() => {
          if(this.recognitionRecv) {
            for(const [key, value] of Object.entries(this.itemList)) {
              if(key == itemName) {
                console.log('Sagi: Find an item:', itemName);
                if(value[2] > 0.4) {
                  console.log('Sagi: Item too far');
                }
                else {
                  this.GripObject(this.itemList[itemName]);
                }
              }
            }
            console.log('Sagi: Item not found');
            action.state = ActionStates.COMPLETED;
            clearInterval(interval);
          }
        }, 200)
        setTimeout(() => {
          if(this.recognitionRecv == false) {
            console.log('Sagi: Search timeout');
            clearInterval(interval);
          }
        }, 4000)
      default:
        break;
    }
  }
  GetRecognition(recognition) {
    console.log('Sagi: Recognition:', recognition);
    this.recognitionRecv = true;
    this.itemList = recognition;
  }
}
const ActionTypes = {
  MOVE: 'move',
  TRANSLATE: 'translate',
  ROTATE: 'rotate',
  TURN: 'turn',
  FORWARD: 'forward',
  GRIP: 'grip',
  SEARCH: 'search',
};

const ActionStates = {
  WAITING: 'waiting',
  EXCUTING: 'excuting',
  COMPLETED: 'completed',
};

module.exports = {
  Sagittarius,
  ActionTypes,
  ActionStates,
}