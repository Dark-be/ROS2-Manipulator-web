const { Action, ActionStates, ActionTypes } = require('./action.js');
class Unitree_Go1 {
    constructor(node, io) {
        this.state = { vx: -0.2, vy: 0.13, vz: 0}
        this.current = { vx: -0.2, vy: 0.13, vz: 0}
        this.node = node;
        this.io = io;
        this.unitreePublisher = node.createPublisher('std_msgs/msg/Float32MultiArray', 'vel_command');
        
        this.actionNow = null;
        // this.actionQueue = [];
        
        setInterval(() => {
            this.current.vx = this.current.vx + (this.state.vx - this.current.vx) * 1;
            this.current.vy = this.current.vy + (this.state.vy - this.current.vy) * 0.5;
            this.current.vz = this.current.vz + (this.state.vz - this.current.vz) * 0.5;
            this.SendUnitree(this.current);
        },100)
        //this.AddAction(new Action(ActionTypes.FORWARD, -0.6, ActionStates.WAITING));
        //this.AddAction(new Action(ActionTypes.TURN, 45, ActionStates.WAITING));
    }
    Reset() {
        this.state = { vx: -0.2, vy: 0.13, vz: 0}
    }
    SendUnitree(msg) {
        this.unitreePublisher.publish({
            data:[msg.vx, msg.vy, msg.vz]
        })
    }
    GetRecognition(recognition) {
        //console.log('Unitree: Recognition:', recognition);
        this.recognitionRecv = true;
        this.itemList = recognition;
    }
    Forward(value) {
        var time = 0;
        if(value < 0) {
            time = -value/0.28;
            this.state.vx = -0.4;
            //this.io.emit('Speech', '正在后退');
        }
        else {
            time = value/0.4;
            this.state.vx = 0.4;
            //this.io.emit('Speech', '正在前进');
        }
        return new Promise((resolve) => {
            setTimeout(() => {
                this.Reset();
                setTimeout(() => {
                    resolve();
                }, 500)
            }, time * 1000)
        })
    }
    Turn(value) {
        var time = value / 180 * 3.14 /1 * 1.05;//defualt speed
        if(time < 0) {
            this.state.vz = -1;
            time = -time;
            //this.io.emit('Speech', '正在右转');
        }
        else {
            this.state.vz = 1;
            //this.io.emit('Speech', '正在左转');
        }
        this.SendUnitree(this.state);
        return new Promise((resolve) => {
            setTimeout(() => {
                this.Reset();
                resolve();
                
            }, time * 1000)
        })
    }
    ActionHandler(action) {
        // if(this.actionNow != null && this.actionNow.state == ActionStates.EXCUTING) {
        //     //console.log('Unitree: Action excuting:', this.actionNow);
        //     return;
        // }
        // if(this.actionQueue.length > 0) {
        //     this.actionNow = this.actionQueue.shift();
        // }
        // else {return;}
        // console.log('Unitree: Action:', this.actionNow);
        
        if(action.type == ActionTypes.UFORWARD) {
            action.state = ActionStates.EXCUTING;
            this.Forward(action.value).then(() => {
                action.state = ActionStates.COMPLETED;
                console.log('Unitree: Action completed:', action);
            })
        }
        else if(action.type == ActionTypes.UTURN) {
            action.state = ActionStates.EXCUTING;
            this.Turn(action.value).then(() => {
                action.state = ActionStates.COMPLETED;
                console.log('Unitree: Action completed:', action);
            })
        }
        // else if(action.type == ActionTypes.USEARCH) {
        //     action.state = ActionStates.EXCUTING;
        //     console.log('Unitree: Searching:', action.value);
        //     var itemName = action.value;
        //     this.itemList = [];
        //     this.recognitionRecv = false;
        //     this.io.emit('RequestRecognition');
        //     this.io.emit('Speech', '正在寻找' + itemName);
        //     var flag=0;
        //     var interval = setInterval(() => {
        //         if(this.recognitionRecv) {
        //             //console.log('Unitree: Search item:',this.itemList);
        //             this.itemList.forEach(item => {
        //               if(item['name'] == itemName) {
        //                 flag=1;
        //                 console.log('Unitree: Find an item:', itemName);
        //                 if(item['position'][2] > 0.4) {
        //                   console.log('Unitree: Item too far');
        //                   this.io.emit('Speech', `物品离我太远了,我要走近点`);
                          
        //                 }
        //                 else {
        //                   this.io.emit('Speech', `找到了${itemName}`);
        //                 }
        //               }
        //             })
        //             if(flag==0){
        //                 console.log('Sagi: Item not found');
        //                 this.io.emit('Speech', `没有找到`);
        //             }

        //             action.state = ActionStates.COMPLETED;
        //             clearInterval(interval);
        //           }
        //     }, 200)
        //     setTimeout(() => {
        //         if(this.recognitionRecv == false) {
        //           this.io.emit('Speech', '我的眼睛好像出了点问题');
        //           console.log('Unitree: Search timeout');
        //           clearInterval(interval);
        //         }
        //     }, 4000)
            
        //}
    }
}


module.exports = {
    Unitree_Go1
}