import {useEffect,useState} from "react"

function History(){

const [bookings,setBookings] = useState([])

useEffect(()=>{

const userId = localStorage.getItem("userId")

fetch(`http://localhost:8808/api/users/${userId}/bookings`)
.then(res=>res.json())
.then(data=>setBookings(data))

},[])

return(

<div style={{padding:"30px"}}>

<h1>My Charging History</h1>

{bookings.map(b => (

<div key={b.bookingId}
style={{
border:"1px solid gray",
padding:"20px",
margin:"10px",
borderRadius:"10px"
}}>

<h3>{b.station}</h3>

<p>Energy Used: {b.energyUsed} kWh</p>

<p>Charging Time: {b.chargingTime} hours</p>

<p>Cost: ₹{b.cost}</p>

</div>

))}

</div>

)

}

export default History