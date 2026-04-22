import {useState} from "react"

function Register(){

const [name,setName] = useState("")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

function register(){

fetch("http://localhost:8808/auth/register",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
name:name,
email:email,
password:password,
role:"USER"
})

})

.then(res=>res.text())
.then(data=>{

alert(data)

window.location="/login"

})

}

return(

<div style={{padding:"30px"}}>

<h1>Register</h1>

<input
placeholder="Name"
onChange={e=>setName(e.target.value)}
/>

<br/><br/>

<input
placeholder="Email"
onChange={e=>setEmail(e.target.value)}
/>

<br/><br/>

<input
type="password"
placeholder="Password"
onChange={e=>setPassword(e.target.value)}
/>

<br/><br/>

<button onClick={register}>
Register
</button>

</div>

)

}

export default Register