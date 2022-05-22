export const initialState = {
    messageList: [],
}

function reducer(state,action) {
    switch (action.type) {
        case 'ADD_TO_MESSAGELIST':
            // adding to basket
            return {
                ...state,
                messageList: [...state.messageList, action.payload],
            }

        default:
            return state;
    }
}

export default reducer;