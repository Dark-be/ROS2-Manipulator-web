const reco_bt = document.getElementById('reco');
const raw_bt = document.getElementById('raw');
const track_bt = document.getElementById('track');
const search_bt = document.getElementById('search');

const item_list_element = document.getElementById('item_list');
const reco_target_element = document.getElementById('reco_target');
const reco_state_element = document.getElementById('reco_state');
const search_range_element = document.getElementById('search_range');
// off searching... not found

item_list = {}
let recognizing = false;
let rawGetting = false;
reco_bt.addEventListener('click', () => {
    if(recognizing == false){
        recognizing = true;
        reco_bt.style.backgroundColor = "#80F080";
    }
    else{
        recognizing = false;
        reco_bt.style.backgroundColor = "white";
    }
})
raw_bt.addEventListener('click', () => {
    if(rawGetting == false){
        rawGetting = true;
        raw_bt.style.backgroundColor = "#80F080";
    }
    else{
        rawGetting = false;
        raw_bt.style.backgroundColor = "white";
    }
})

setInterval(() => {
    if(recognizing){
        socket.emit('GetRecognition');
    }
    else if(rawGetting){
        socket.emit('GetImage');
    }
}, 400)


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