const TransactionFilters = () => {
  return (

<div className="flex gap-4">

<input
className="bg-surface-container p-2 rounded"
placeholder="Search"
/>

<select className="bg-surface-container p-2 rounded">
<option>All</option>
<option>Food</option>
<option>Shopping</option>
</select>

</div>

  )
}

export default TransactionFilters