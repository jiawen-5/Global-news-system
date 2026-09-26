import IndexRouter from "./router/IndexRouter.jsx";
import { Provider } from "react-redux";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import store from "./redux/store";

function App() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <IndexRouter></IndexRouter>
      </Provider>
    </ThemeProvider>
  )
}

export default App;