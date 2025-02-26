// ------------✅ If You Are Using configureStore from Redux Toolkit:
// import { configureStore } from "@reduxjs/toolkit";
// import { composeWithDevTools } from "@redux-devtools/extension"; // Updated import
// import thunk from "redux-thunk";
// import rootReducer from "./reducers"; // Ensure this is correctly imported

// const store = configureStore({
//   reducer: rootReducer,
//   middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
//   devTools: composeWithDevTools(),
// });

// export default store;



// ---------------✅ If You Are Using createStore from Redux:
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "@redux-devtools/extension"; // Corrected import
import rootReducer from "./reducers"; // Ensure correct import

const middleware = [thunk];

const store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;
