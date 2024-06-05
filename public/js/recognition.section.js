const reco_bt = document.getElementById('reco');
const track_bt = document.getElementById('track');
const search_bt = document.getElementById('search');

const item_list_element = document.getElementById('item_list');
const reco_target_element = document.getElementById('reco_target');
const reco_state_element = document.getElementById('reco_state');
const search_range_element = document.getElementById('search_range');
// off searching... not found

item_list = {}
let recognizing = false;
let recognizing_recv = true;
reco_bt.addEventListener('click', () => {
    if(recognizing == false){
        recognizing = true;
        reco_bt.style.backgroundColor = "#80F080";
        socket.emit('GetRecognition', true);
    }
    else{
        recognizing = false;
        reco_bt.style.backgroundColor = "white";
        socket.emit('GetRecognition', false);
    }
})
let searching = false;
search_bt.addEventListener('click', () => {
    if(searching == false){
        searching = true;
        reco_state_element.innerText = 'Searching...';
        var action = new Action('search', reco_target_element.value);
        socket.emit('SagittariusAction', action);
        search_bt.style.backgroundColor = "#80F080";
    }
    else{
        searching = false;
        
        search_bt.style.backgroundColor = "white";
    }
})

socket.on('GetRecognition', (data) => {
    item_list_element.innerText = '  ';
    for(const [key, value] of Object.entries(data)){
        item_list_element.innerText += `${key},  `;
    }
    console.log("Recognition updated");
})

let tracking = false;
track_bt.addEventListener('click', () => {
    socket.emit('Search', trackTarget);
})