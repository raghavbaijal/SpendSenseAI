

interface ButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const Button = ({ children, className, onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg bg-primary text-black font-medium hover:opacity-90 transition ${className}`}
    >
      {children}
    </button>
  )
}

export default Button