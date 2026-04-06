import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

const ProtectedRoute = ({ children }: any) => {

const [loading,setLoading] = useState(true)
const [user,setUser] = useState<any>(null)

useEffect(()=>{

const checkUser = async()=>{

const { data:{ session } } =
await supabase.auth.getSession()

setUser(session?.user || null)
setLoading(false)

}

checkUser()

},[])

if(loading){
return <div className="p-10">Loading...</div>
}

if(!user){
return <Navigate to="/login" />
}

return children

}

export default ProtectedRoute