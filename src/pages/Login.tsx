import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

const Login = () => {

const navigate = useNavigate()

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [loading,setLoading] = useState(false)


const handleLogin = async (e:any)=>{

e.preventDefault()

setLoading(true)

const { error } =
await supabase.auth.signInWithPassword({

email,
password

})

if(error){
alert(error.message)
}else{
navigate("/dashboard")
}

setLoading(false)

}


// Google Login

const googleLogin = async()=>{

await supabase.auth.signInWithOAuth({

provider:"google",

options:{
redirectTo:
window.location.origin + "/dashboard"
}

})

}


return (
<div className="bg-surface-dim text-on-background min-h-screen flex flex-col">

<main className="flex-grow flex flex-col md:flex-row">

{/* Left Side */}

<div className="hidden md:flex md:w-1/2 bg-surface-container-lowest relative flex-col justify-between p-16">

<div>

<div className="flex items-center gap-3">

<span className="material-symbols-outlined text-primary text-4xl">
account_balance_wallet
</span>

<h1 className="text-3xl font-bold">
SpendSense AI
</h1>

</div>

</div>

<div>

<h2 className="text-5xl font-bold text-primary-fixed-dim">
Your AI Financial Co-Pilot
</h2>

<p className="mt-4 opacity-60">
Sophisticated intelligence for modern finance
</p>

</div>

<div className="text-xs opacity-60">
Encrypted Systems Online
</div>

</div>


{/* Right Side */}

<div className="flex-grow flex items-center justify-center p-8">

<div className="w-full max-w-md">

<div className="bg-surface-container p-10 rounded-xl">

<h2 className="text-3xl font-bold mb-2">
Welcome Back
</h2>

<p className="opacity-60 mb-8">
Access your dashboard
</p>


<form
onSubmit={handleLogin}
className="space-y-6"
>

<div>

<label className="text-xs uppercase opacity-60">
Email
</label>

<input
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full mt-2 bg-surface-container-highest p-3 rounded-lg"
placeholder="name@email.com"
/>

</div>


<div>

<label className="text-xs uppercase opacity-60">
Password
</label>

<input
type="password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
className="w-full mt-2 bg-surface-container-highest p-3 rounded-lg"
/>

</div>


<button className="w-full py-4 bg-primary text-black rounded-lg font-semibold">

{loading ? "Logging..." : "Login"}

</button>

</form>


<div className="my-8 text-center text-xs opacity-60">
or continue with
</div>


<div className="grid grid-cols-2 gap-4">

<button
onClick={googleLogin}
className="border p-3 rounded-lg"
>

Google

</button>

<button className="border p-3 rounded-lg">
GitHub
</button>

</div>


<p className="mt-8 text-center text-sm opacity-60">

Don't have account?

<span
onClick={()=>navigate("/register")}
className="text-primary ml-2 cursor-pointer"
>

Sign up

</span>

</p>


</div>

</div>

</div>

</main>

<footer className="py-8 text-center text-xs opacity-40">
Secure Financial Data • End-to-End Encrypted
</footer>

</div>
)

}

export default Login