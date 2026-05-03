'use client'


interface AddItemButtonProps {
  onClick: () => void
}
function AddItemButton({onClick}: AddItemButtonProps){
  return(
    <section className="flex justify-center items-center bg-card-cream w-2xs p-3 rounded">
      <button onClick={onClick}>
        <span>+ Add Product</span>
      </button>
    </section>
  );
}

export default AddItemButton