function Response(command){
  // 常用命令的反馈
  if(command == '小狗前进'){
    const messages = ['好的，马上到你身边！', '等我一下，我正快速赶来！', '听见了，我这就过来！'];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  if(command == '拿个瓶子'){
    const messages = ['明白，让我找找看！', '好的，我马上去找！', '正在搜索瓶子，稍等片刻！'];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  if(command == '小狗后退'){
    const messages = ['收到，我正在后退！', '好的，我马上就后退！', '后退中，请注意安全！'];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  // 增加新的命令反馈
  if(command == '小狗摇摇手'){
    return '需要我做什么吗？';
  }
  if(command == '关灯'){
    return '灯即将关闭，小心脚下！';
  }
  if(command == '放下音乐'){
    const songs = ['好的，放点轻松音乐！', '音乐来了，希望你喜欢！', '现在为您播放音乐！'];
    return songs[Math.floor(Math.random() * songs.length)];
  }

  // 处理未知命令的反馈
  const unknownMessages = [
    '对不起，我没能理解您的命令。', 
    '我不确定您需要什么，能再说一次吗？', 
    '听起来有点困难，可以换个说法吗？'
  ];
  return unknownMessages[Math.floor(Math.random() * unknownMessages.length)];
}


module.exports = {
  Response
}