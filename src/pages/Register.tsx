import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

const Register = () => {

const navigate = useNavigate()

const [name,setName] = useState("")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [confirm,setConfirm] = useState("")
const [loading,setLoading] = useState(false)


const handleRegister = async (e:any) => {

e.preventDefault()

if(password !== confirm){
alert("Passwords do not match")
return
}

setLoading(true)

const { error } = await supabase.auth.signUp({

email,
password,

options:{
data:{
full_name:name
}
}

})

if(error){
alert(error.message)
}else{
navigate("/dashboard")
}

setLoading(false)

}


// Google Signup

const googleSignup = async()=>{

await supabase.auth.signInWithOAuth({

provider:"google",

options:{
redirectTo:
window.location.origin + "/dashboard"
}

})

}


return (
<div className="min-h-screen flex bg-background text-on-background">

{/* Left Section */}

<section className="hidden lg:flex lg:w-1/2 bg-surface-container-lowest p-12 flex-col justify-between">

<div>

<div className="flex items-center gap-3">

<div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center">

<span className="material-symbols-outlined">
toll
</span>

</div>

<h1 className="text-2xl font-bold">
SpendSense AI
</h1>

</div>

</div>

<div>

<h2 className="text-5xl font-bold">
Join the Future of
<br />
<span className="text-primary">
Personal Finance
</span>

</h2>

</div>

<div className="text-xs opacity-40">
© SpendSense AI
</div>

</section>


{/* Right Section */}

<section className="flex-1 flex items-center justify-center p-10">

<div className="w-full max-w-md space-y-6">

<div>

<h2 className="text-3xl font-bold">
Create Account
</h2>

<p className="opacity-60">
Experience AI Finance
</p>

</div>


<div className="bg-surface-container-low p-8 rounded-xl">

<form
onSubmit={handleRegister}
className="space-y-5"
>

<div>

<label className="text-xs opacity-60">
Full Name
</label>

<input
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full p-3 bg-surface-container-highest rounded-lg"
placeholder="John Doe"
/>

</div>


<div>

<label className="text-xs opacity-60">
Email
</label>

<input
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full p-3 bg-surface-container-highest rounded-lg"
placeholder="email@gmail.com"
/>

</div>


<div className="grid grid-cols-2 gap-4">

<div>

<label className="text-xs opacity-60">
Password
</label>

<input
type="password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
className="w-full p-3 bg-surface-container-highest rounded-lg"
/>

</div>


<div>

<label className="text-xs opacity-60">
Confirm
</label>

<input
type="password"
value={confirm}
onChange={(e)=>setConfirm(e.target.value)}
className="w-full p-3 bg-surface-container-highest rounded-lg"
/>

</div>

</div>


<button
className="w-full py-4 bg-gradient-to-br from-primary to-primary-container rounded-lg font-bold"
>

{loading ? "Creating..." : "Create Account"}

</button>

</form>


<div className="text-center text-xs opacity-50 my-4">
or signup with
</div>


<div className="grid grid-cols-2 gap-4">

<button
onClick={googleSignup}
className="border p-3 rounded-lg"
>

Google

</button>

<button className="border p-3 rounded-lg">
GitHub
</button>

</div>

</div>


<p className="text-center text-sm opacity-60">

Already have account?

<span
onClick={()=>navigate("/login")}
className="text-primary ml-2 cursor-pointer"
>

Login

</span>

</p>

</div>

</section>

</div>
)

}

export default Register