import { useState } from "react"

function Login(){

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

function login(){

fetch("http://localhost:8808/auth/login",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email:email,
password:password
})

})

.then(res=>res.json())
.then(data=>{

// store user session
localStorage.setItem("token",data.token)
localStorage.setItem("userId",data.userId)
localStorage.setItem("role",data.role)

alert("Login Successful")

window.location="/"

})
.catch(err=>{

alert("Login failed")

})

}

return(

<div style={{padding:"40px"}}>

<h1>Login</h1>

<div style={{marginBottom:"10px"}}>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{padding:"8px",width:"250px"}}
/>

</div>

<div style={{marginBottom:"10px"}}>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{padding:"8px",width:"250px"}}
/>

</div>

<button onClick={login} style={{padding:"8px 20px"}}>
Login
</button>

<br/><br/>

<a href="/register">
Create new account
</a>

</div>

)

}

export default Login