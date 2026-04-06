const Modal = ({ open, children, onClose }: any) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-surface-container p-8 rounded-xl w-96">

        {children}

        <button
          onClick={onClose}
          className="mt-4 text-sm opacity-60"
        >
          Close
        </button>

      </div>

    </div>
  )
}

export default Modal