
function sleep(ms){
    const date = Date.now();
    let currentDate;
    do {
        currentDate = Date.now();
    } while (currentDate - date < ms);
}