import Image from "next/image";

function Promotions() { 
  const text = "What's New!";
  const cardDesign = "flex w-full h-32 bg-[#F4EBD0] rounded-2xl px-4 sm:h-28 sm:rounded-[2vw] justify-between overflow-visible";
  const infoDesign = "flex flex-col";
  const imageLayoutDesign = "flex items-end";
  
  return(
    <section className="flex flex-col gap-2 px-4 w-full sm:px-6 md:px-8 text-dark-brown">
      <div className="font-roboto-mono flex">{text}</div>
      <div className={cardDesign}> 
        <div className={infoDesign}>
          <span>Lorem Ipsum</span>
          <span>milk, coffee</span>
          <span>P60.00</span>
        </div>
        <section className={imageLayoutDesign}>
          <Image 
            src="/promotions-drink.jpg"
            alt="Promotion Drink"
            width={120}
            height={140}
            className="-mt-10"
          />
        </section>
      </div>  
    </section>
  );
}

export default Promotions;