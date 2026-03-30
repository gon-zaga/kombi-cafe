

function ViewOrderBar ({totalItems, setTotalItems}: {totalItems: number, setTotalItems: (item: number) => void}) {
  return(
      <div className="flex flex-row items justify-center sticky bottom-0 my-2.5">
        <button className=" text-white p-2 w-3xs flex flex-row justify-center border rounded-2xl bg-dark-brown">
          VIEW ORDER
          <div className="h-auto flex border-l border-white mx-2.5 shrink-0"></div>
        </button>
      </div>
  );
}

export default ViewOrderBar