import {BrowserRouter,Routes,Route} from "react-router-dom"

import Home from "./pages/Home"
import Station from "./pages/Station"
import History from "./pages/History"
import OwnerDashboard from "./pages/OwnerDashboard"
import Login from "./pages/Login"
import Register from "./pages/Register"

function App(){

return(

<BrowserRouter>

<Routes>

<Route path="/" element={<Home/>} />

<Route path="/station/:id" element={<Station/>} />

<Route path="/history" element={<History/>} />

<Route path="/owner" element={<OwnerDashboard/>} />

<Route path="/login" element={<Login/>} />

<Route path="/register" element={<Register/>} />

</Routes>

</BrowserRouter>

)

}

export default App