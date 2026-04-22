import { useEffect, useState } from "react"

function Home(){

const [stations,setStations] = useState([])
const token = localStorage.getItem("token")

useEffect(()=>{

fetch("http://localhost:8808/api/stations")
.then(res => res.json())
.then(data => setStations(data))

},[])

function logout(){

localStorage.removeItem("token")

alert("Logged out")

window.location="/"

}

return(

<div style={{padding:"30px"}}>

<div style={{display:"flex",justifyContent:"space-between"}}>

<h1>EV Charging Stations</h1>

<div>

{!token && (

<>

<a href="/login">
<button style={{marginRight:"10px"}}>Login</button>
</a>

<a href="/register">
<button style={{marginRight:"10px"}}>Register</button>
</a>

</>

)}

{token && (

<>

<a href="/history">
<button style={{marginRight:"10px"}}>My Charging History</button>
</a>

{localStorage.getItem("role") === "OWNER" && (

<a href="/owner">
<button>Owner Dashboard</button>
</a>

)}

<button onClick={logout}>
Logout
</button>

</>

)}

</div>

</div>

{stations.map(station => (

<div
key={station.id}
style={{
border:"1px solid gray",
padding:"20px",
margin:"10px",
borderRadius:"10px"
}}
>

<h2>
<a href={`/station/${station.id}`}>
{station.name}
</a>
</h2>

<p>Location: {station.location}</p>

<p>Rating: ⭐ {station.rating}</p>

<p>Available Chargers: {station.availableChargers}</p>

</div>

))}

</div>

)

}

export default Home