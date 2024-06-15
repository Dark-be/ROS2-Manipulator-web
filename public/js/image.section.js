const realsense_image = document.getElementById("realsense");

socket.on('Image', (data) => {
    realsense_image.src = 'data:image/jpeg;base64,' + data;
    console.log('Image updated');
})