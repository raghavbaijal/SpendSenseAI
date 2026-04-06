const BudgetProgress = ({ label, value }: any) => {
  return (

<div>

<div className="flex justify-between mb-1">
{label}
{value}%
</div>

<div className="h-2 bg-background rounded">

<div
className="h-full bg-primary"
style={{ width: `${value}%` }}
/>

</div>

</div>

  )
}

export default BudgetProgress