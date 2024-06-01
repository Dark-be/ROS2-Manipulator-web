async function getSpeechKey() {
    const res = await axios.get('/api/get-speech-token');
    const key = res.data.key;
    const region = res.data.region;

    return { key: key, region: region };
}
async function getChatKey() {
    const res = await axios.get('/api/get-chat-token');
    const chatKey = res.data.key;
    return chatKey;
}
const chatButton = document.getElementById("chat_bt");
const clsButton = document.getElementById("cls_bt");
const recoButton = document.getElementById("reco_bt")
const chatState = document.getElementById("chat_state")
const chatText = document.getElementById("chat_text");
chatState.innerText = 'Ready to chat.';
const command = document.getElementById('command');
var commands;

chatButton.addEventListener('click', sttFromMic);
clsButton.addEventListener('click', function(){
    console.log('Output has been clear')
    chatText.innerText = '';
    command.innerText = 'Command:';
    //textToSpeech("Output has been clear.");
});
recoButton.addEventListener('click', () => {
    getRecognitction();
    item_list_str = "";
    for(const [key, value] of Object.entries(item_list)){
        item_list_str += `${key}, `;
    }
    console.log(item_list_str)
})
async function sttFromMic() {
    const soeechKey = await getSpeechKey();

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(soeechKey.key, soeechKey.region);
    speechConfig.speechRecognitionLanguage = 'zh-CN';

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    chatState.innerText = 'Speak to microphone...'
    recognizer.recognizeOnceAsync(
        function(result) {
            if(result.text){
                chatText.innerText += '\nRes: ' + result.text;
                chatState.innerText = 'Ready to chat.';
                commandParser(result.text)
            }
            else {
                chatState.innerText = 'Please try again.';
            }
        },
        function(err){
            console.log(err);
            chatState.innerText = 'Error: ' + err;
        }
    );
}
async function textToSpeech(str){
    const soeechKey = await getSpeechKey();

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(soeechKey.key, soeechKey.region);

    const player = new SpeechSDK.SpeakerAudioDestination();
    const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(player);
    speechConfig.SpeechSynthesisVoiceName = "en-US-AndrewNeural";
    let synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(str, 
    function(result) {
        synthesizer.close();
        synthesizer = undefined;
        console.log('Finished speaking')
    },
    function (err) {
        synthesizer.close();
        synthesizer = undefined;
        console.log(err);
    });
}
async function chatWithGPT(str){
    console.log('User Message:', str);
    const postData = {
        model: 'gpt-3.5-turbo',
        messages: [{
            role: 'user',
            content: str
        }],
        temperature: 0.7,
    };
    const chatKey = await getChatKey();

    await axios.post('https://api.chatanywhere.com.cn/v1/chat/completions', postData,
    {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${chatKey}`,
        },
    }).then(response => {
        result = response.data.choices[0].message.content
        console.log('ChatMessage:', result);
        // textToSpeech(result)
        commands = result;
    }).catch(error => {
        console.error(error);
    });
}

const actionQueue = [];
const moveRegex = /move\{x:(-?\d+(\.\d+)?),y:(-?\d+(\.\d+)?),z:(-?\d+(\.\d+)?)\}/
const gripRegex = /grip\{(\d+)\}/
const trackRegex = /track/

async function commandParser(str){
    if(str){
        console.log('Parsering command');
        await chatWithGPT(`现在你是一个将自然语言解析为指令的模型,
        例如,机械臂坐标是{x:0,y:0,z:0.2},单位为米，我的语音指令为"往上移动五厘米",
        那么你应该给出move{x:0,y:0,z:0.25}, 
        如果我还想要抓取,你可以继续在上一个指令后添加指令grip{100},100为完全握紧,0为完全松开,你也可以取中间的整数值来控制松紧,记住指令之间应该用空格隔开,
        所有识别物品的物品列表是${item_list_str},我要求识别时,你应该回答track{}。或者我问你是否存在某件物品，你也应该回答。
        现在请你忽略掉上面的语音消息,接下来才是真的解析指令，当前真实机械臂坐标是{x:${pose.x},y:${pose.y},z:${pose.z}},
        我的语音指令为"${str}"，那么你应该回答什么？`);
        console.log('Commands:', commands);
        if(commands){
            const commandList = commands.split(' ')
            console.log(commandList);
            for(const command of commandList) {
                let match;
                if(match = gripRegex.exec(command)){
                    command.innerText += ('\n' + command);

                    grip_range.value = match[1];
                    console.log('Grip to:', match[1]);
                    socket.emit('Grip', grip_range.value);
                } else if(match = moveRegex.exec(command)){
                    command.innerText += ('\n' + command);

                    const x = parseFloat(match[1]);
                    const y = parseFloat(match[3]);
                    const z = parseFloat(match[5]);
                    console.log("Move to X:", x, "Y:", y, "Z:", z);

                    // lastPos.x = x * 400 + x_orig;
                    // lastPos.y = y * 400 + y_orig;
                    pose.x = x;
                    pose.y = y;
                    pose.z = z;
                    z_range.value = z * 100;
                    socket.emit('Pose',{
                        x: pose.x,
                        y: pose.y,
                        z: pose.z,
                        roll: pose.roll,
                        pitch: pose.pitch,
                        yaw: pose.yaw
                    })
                }
                else if(match = trackRegex.exec(command)){
                    trackSwitch.click();
                    console.log('Track:', match[1]);
                    
                }
                sleep(2000);
            }
        }
    }
}
