
const vx_up_button = document.getElementById('vx_up');
const vx_down_button = document.getElementById('vx_down');
const vy_up_button = document.getElementById('vy_up');
const vy_down_button = document.getElementById('vy_down');
const vz_up_button = document.getElementById('vz_up');
const vz_down_button = document.getElementById('vz_down');
const send1_button = document.getElementById('send1');

vx_up_button.addEventListener('click', () => {
    actionNowUnitree = new Action('forward', accuracyUnitree);
})
vx_down_button.addEventListener('click', () => {
    actionNowUnitree = new Action('forward', -accuracyUnitree);
})
// vy_up_button.addEventListener('click', () => {
    
// })
// vy_down_button.addEventListener('click', () => {
    
// })
vz_up_button.addEventListener('click', () => {
    actionNowUnitree = new Action('turn', accuracyUnitree * 100);
})
vz_down_button.addEventListener('click', () => {
    actionNowUnitree = new Action('turn', -accuracyUnitree * 100);
})

const accuracy_element_unitree = document.getElementById('accuracy_unitree');
var accuracyUnitree = 0.3;
accuracy_element_unitree.addEventListener('input', function() {
    accuracyUnitree = parseFloat(this.value);
    if (!isNaN(accuracyUnitree)) {
        console.log('Accuracy Unitree:', accuracyUnitree);
    } else {
        this.value = 0;
        accuracyUnitree = 0;
        console.log('Invalid Accuracy');
    }
})

sendingUnitree = false;
send1_button.addEventListener('click', () => {
    if(sendingUnitree == false){
        sendingUnitree = true;
        send1_button.style.backgroundColor = "#80F080";
        console.log('Sending Unitree');
    }
    else
    {
        sendingUnitree = false;
        send1_button.style.backgroundColor = "White";
        console.log('Stop Sending Unitree');
    }
})

var currentState = {
    vx: 0,
    vy: 0,
    vz: 0,
};
