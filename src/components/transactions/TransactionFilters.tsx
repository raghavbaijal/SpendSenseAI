const TransactionCard = ({ name, amount }: any) => {
  return (

<div className="flex justify-between bg-surface-container p-4 rounded-xl">

<div>
{name}
</div>

<div>
₹{amount}
</div>

</div>

  )
}

export default TransactionCard