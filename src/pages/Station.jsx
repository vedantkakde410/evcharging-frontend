import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

function Station(){

const {id} = useParams()

const [chargers,setChargers] = useState([])

useEffect(()=>{

fetch(`http://localhost:8808/api/stations/${id}/chargers`)
.then(res=>res.json())
.then(data=>setChargers(data))

},[id])

function bookCharger(chargerId){

const userId = localStorage.getItem("userId")

if(!userId){
alert("Please login first")
window.location="/login"
return
}

fetch("http://localhost:8808/api/bookings",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
userId:userId,
vehicleId:1,
chargerId:chargerId
})

})

.then(res=>res.json())
.then(data=>{

alert("Booking created successfully")

})
.catch(err=>{

alert("Booking failed")

})

}

return(

<div style={{padding:"30px"}}>

<h1>Chargers</h1>

{chargers.length === 0 && (

<p>No chargers available</p>

)}

{chargers.map(charger => (

<div
key={charger.id}
style={{
border:"1px solid gray",
padding:"20px",
margin:"10px",
borderRadius:"10px"
}}
>

<h3>{charger.power} kW Charger</h3>

<p>Price: ₹{charger.pricePerKwh} / kWh</p>

<p>Status: {charger.status}</p>

{charger.status === "AVAILABLE" ? (

<button onClick={()=>bookCharger(charger.id)}>
Book Charger
</button>

) : (

<p style={{color:"red"}}>Currently Busy</p>

)}

</div>

))}

</div>

)

}

export default Station