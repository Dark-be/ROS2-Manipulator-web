var speech_key = '';
var speech_region = '';
var chat_key = '';
var chat_url = '';
const chat_url_end = ['.cn', '.com.cn', '.tech']
async function getSpeechKey() {
  if(!speech_key || !speech_region){
    const res = await axios.get('/api/get-speech-token');
    speech_key = res.data.key;
    speech_region = res.data.region;
    console.log('Got speech-token');
  }
}
async function getChatKey() {
  if(!chat_key || !chat_url){
    const res = await axios.get('/api/get-chat-token');
    chat_key = res.data.key;
    chat_url = res.data.url;
    console.log('Got chat-token');
  }
}
var is_command = false;
var is_vpn = false;
var end_num = 1;
const chat_message_text = document.getElementById('chat_message');
const is_command_bt = document.getElementById('is_command');
const is_vpn_bt = document.getElementById('is_vpn');
const chat_send_bt = document.getElementById('chat_send');
const chat_response_text = document.getElementById('chat_response');
const stt_bt = document.getElementById('stt');

is_command_bt.addEventListener('click', () => {
  if(is_command == false){
    console.log('Command mode');
    is_command = true;
    is_command_bt.style.backgroundColor = "#80F080";
  }
  else{
    console.log('Chat mode');
    is_command = false;
    is_command_bt.style.backgroundColor = "white";
  }
})
is_vpn_bt.addEventListener('click', () => {
  if(is_vpn == false){
    is_vpn = true;
    end_num = 0;
    is_vpn_bt.style.backgroundColor = "#80F080";
  }
  else{
    is_vpn = false;
    end_num = 1;
    is_vpn_bt.style.backgroundColor = "white";
  }
})
chat_send_bt.addEventListener('click', async () => {
  chat_response_text.innerText = 'Waiting for response...';
  if(is_command){
    var res = await sendCommandMessage(chat_message_text.value);
    chat_response_text.innerText = res;
    commandParser(res);
  }
  else{
    var res = await sendChatMessage(chat_message_text.value);
    chat_response_text.innerText = res;
        
  }
})
var speech_recognizing = false;
stt_bt.addEventListener('click', async () => {
  if(speech_recognizing){
    return;
  }
  speech_recognizing = true;
  stt_bt.style.backgroundColor = "#80F080";
  await sttFromMic();
  stt_bt.style.backgroundColor = "white";
  speech_recognizing = false;
})

async function sttFromMic() {
  await getSpeechKey();

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speech_key, speech_region);
  speechConfig.speechRecognitionLanguage = 'zh-CN';

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
  chat_message_text.value = 'Speak to microphone...'
  console.log('Speak to microphone...');
  recognizer.recognizeOnceAsync(
    function(result) {
      if(result.text){
        chat_message_text.value = result.text;
      }
      else {
        chat_message_text.value = 'Please try again...';
      }
    },
    function(err){
      console.log(err);
      chat_message_text.value = 'Error';
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
async function sendChatMessage(str){
  try {
    await getChatKey();
    const postData = {
      model: 'gpt-3.5-turbo',
      messages: [{
          role: 'user',
          content: str
      }],
      temperature: 0.7,
    };
    const response = await axios.post(chat_url + chat_url_end[end_num] + '/v1/chat/completions', postData,
    {
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chat_key}`,
      },
    })
    console.log('Response:', response.data.choices[0].message.content);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(error);
    return 'Error';
  }
}
async function sendCommandMessage(str){
  return await sendChatMessage(`现在你是一个智能机器人，你可以通过基本动作指令控制机械臂，也就是你的手，尽可能将我的自然语言指令变成基本动作指令序列。
    你能够操作的指令包括updown leftright forward grip search。
    比如updown 0.02表示向上移动2厘米，updown -0.02表示向下移动2厘米，leftright 2表示向左转2度，leftright -2表示向右转2度，
    forward 0.02表示向前移动2厘米，forward -0.02表示向后移动2厘米。grip 50表示夹取力度为50，力度总共有100级。
    search item表示搜索物品item，你应该将物品名字转为英文，比如我让你搜索瓶子，对应的指令应该是search bottle。
    接下来我把语音识别得到的自然语言指令传给你，你需要解析这个指令，然后按顺序告诉我应该执行的动作。
    比如updown 0.02,updown -0.02表示先向上移动2厘米再向下移动2厘米，不同指令之间用英文逗号隔开。
    我的自然语言指令是：${str}，请解析并回答，不要有除指令以外的多余的输出。
  `);
}

async function commandParser(str){
  console.log('Parsering command...');
  if(str){
    var commandStr = str;
    console.log('Commands:', str);
    const commandList = commandStr.split(',')
    for(const command of commandList) {
      action = command.split(' ');
      var i = 0;
      if(action[0] == ''){
        i += 1;
      }
      type = action[i];
      value = action[i+1];
      if(!isNaN(value)){
          value = parseFloat(value);
      }
      var action = new Action(type, value);
      console.log('AI Action:', action);
      socket.emit('SagittariusAction', action);
    }
  }
}
