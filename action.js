class Action {
    constructor(type, value, state = 'None') {
        this.type = type;
        this.value = value;
        this.state = state;
    }
}
const ActionStates = {
    WAITING: 'waiting',
    EXCUTING: 'excuting',
    COMPLETED: 'completed',
};
const ActionTypes = {
    UFORWARD: 'uforward',
    UTURN: 'uturn',
    USEARCH: 'usearch',
    SMOVE: 'smove',
    STRANSLATE: 'stranslate',
    SROTATE: 'srotate',
    STURN: 'sturn',
    SFORWARD: 'sforward',
    SGRIP: 'sgrip',
    SSEARCH: 'ssearch',

}
           
module.exports = {
    Action,
    ActionStates,
    ActionTypes,
}
