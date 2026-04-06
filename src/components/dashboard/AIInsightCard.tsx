const AIInsightCard = ({ title, description }: any) => {
  return (

<div className="bg-surface-container p-6 rounded-xl">

<h3 className="font-bold">
{title}
</h3>

<p className="opacity-60 text-sm">
{description}
</p>

</div>

  )
}

export default AIInsightCard