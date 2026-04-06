interface InsightCardProps {
  title: string
  description: string
  amount?: string
  type?: "success" | "warning" | "info"
}

const InsightCard = ({
  title,
  description,
  amount,
  type = "info"
}: InsightCardProps) => {

const getColor = () => {
switch(type) {
case "success":
return "text-secondary"
case "warning":
return "text-yellow-400"
default:
return "text-primary"
}
}

return (

<div className="bg-surface-container p-6 rounded-xl hover:bg-surface-container-high transition cursor-pointer">

<div className="flex justify-between items-start">

<div>

<h3 className="font-semibold mb-1">
{title}
</h3>

<p className="text-sm opacity-60">
{description}
</p>

</div>

{amount && (

<div className={`text-lg font-bold ${getColor()}`}>
{amount}
</div>

)}

</div>

</div>

)
}

export default InsightCard