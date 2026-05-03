

function StatsCard() {
  return(
    <section>
            {/**BOXES */}
      <div className="flex flex-col p-10">

        {/**ORDER PROCESSED */}
        <div className="h-32 bg-card-cream flex flex-col p-2 justify-center items-center mb-3">
          <span className="font-bold text-2xl">ORDER PROCESSED</span>
          <span className="font-semibold text-4xl">0</span>
        </div>

        {/**SALES */}
        <div className="h-32 bg-card-cream flex flex-col p-2 justify-center items-center mb-3">
          <span className="font-bold text-2xl">SALES</span>
          <span className="font-semibold text-4xl">0</span>
        </div>

        <div className="h-32 bg-card-cream flex flex-col p-2 justify-center items-center mb-3">
          <span className="font-bold text-2xl">LOW STOCKS ITEMS</span>
          <span className="font-semibold text-4xl">0</span>
        </div>
      </div>
    </section>
  );
}

export default StatsCard