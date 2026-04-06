interface Props {
  title: string
  value: string | number
}

const Card = ({ title, value }: Props) => {
  return (
    <div className="bg-card p-6 rounded-xl">
      <p className="text-muted-foreground">
        {title}
      </p>

      <h2 className="text-2xl font-bold mt-2">
        {value}
      </h2>
    </div>
  )
}

export default Card