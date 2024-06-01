const reco_bt = document.getElementById('reco');
const track_bt = document.getElementById('track');
const search_bt = document.getElementById('search');

const item_list_element = document.getElementById('item_list');
const reco_target_element = document.getElementById('reco_target');
const reco_state_element = document.getElementById('reco_state');
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
        socket.emit('Search', reco_target_element.value);
        search_bt.style.backgroundColor = "#80F080";
    }
    else{
        searching = false;
        socket.emit('Search', 'stop');
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

socket.on('GetSearch', (data) => {
    searching = false;
    search_bt.style.backgroundColor = "white";
    if(data){
        reco_state_element.innerText = 'Found';
    }
    else{
        reco_state_element.innerText = 'Not Found';
    }
    console.log("Search updated");
})

let tracking = false;
track_bt.addEventListener('click', () => {
    socket.emit('Search', trackTarget);
})

function track(item){
    //console.log(item_list);
    if(item_list[item]){
        console.log('Yes, I have found', item);
        x = item_list[item][0][0];
        y = item_list[item][0][1];
        x -= 320;
        y -= 240;
        if(x > 50){
            Turn(-x / 50 *5);
        }
        if(x < -50){
            Turn(-x / 50*5);
        }
        console.log('Item at X:', x , 'Y:', y)
    }
    else{
        //console.log('No, I have not found', item);
        //textToSpeech(`No, I have not found ${item}`);
    }
}