import {useEffect,useState} from "react"

function OwnerDashboard(){

const [revenue,setRevenue] = useState({})
const [energy,setEnergy] = useState({})
const [bookings,setBookings] = useState([])

useEffect(()=>{

fetch("http://localhost:8808/owner/reports/revenue")
.then(res=>res.json())
.then(data=>setRevenue(data))

fetch("http://localhost:8808/owner/reports/energy")
.then(res=>res.json())
.then(data=>setEnergy(data))

fetch("http://localhost:8808/owner/reports/bookings")
.then(res=>res.json())
.then(data=>setBookings(data))

},[])

return(

<div style={{padding:"30px"}}>

<h1>Owner Dashboard</h1>

<div style={{marginBottom:"30px"}}>

<h2>Total Revenue</h2>
<p>₹ {revenue.totalRevenue}</p>

<h2>Total Energy Delivered</h2>
<p>{energy.totalEnergyDelivered} kWh</p>

</div>

<h2>All Charging Sessions</h2>

{bookings.map(b => (

<div key={b.bookingId}
style={{
border:"1px solid gray",
padding:"20px",
margin:"10px",
borderRadius:"10px"
}}>

<p>User: {b.user}</p>

<p>Station: {b.station}</p>

<p>Energy Used: {b.energyUsed} kWh</p>

<p>Cost: ₹{b.cost}</p>

</div>

))}

</div>

)

}

export default OwnerDashboard