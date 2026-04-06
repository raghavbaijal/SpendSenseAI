const BudgetCard = ({ title, amount }: any) => {
  return (

<div className="bg-surface-container p-6 rounded-xl">

<p className="text-xs opacity-60">
{title}
</p>

<h3 className="text-2xl font-bold">
₹{amount}
</h3>

</div>

  )
}

export default BudgetCard