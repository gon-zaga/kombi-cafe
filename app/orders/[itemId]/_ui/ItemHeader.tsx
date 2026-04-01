'use client'

import Image from "next/image";
import {useRouter} from "next/navigation";

// Template for the Prop, Expectations
type ItemHeaderProp = {
  itemImg: string;
  itemName: string;
  itemId: number;
}


function ItemHeader({itemImg, itemName, itemId}: ItemHeaderProp) {
  const router = useRouter();
  return (
          <div className="bg-[#F4EBD0] flex justify-center h-auto w-full shrink-0 drop-shadow-lg relative">
            <Image 
              src={itemImg}
              alt={itemName}
              height={140}
              width={140}
            />
            <div className="absolute left-4 top-3 text-white bg-dark-brown rounded-full p-4 font-bold text-4xl font-roboto-mono">
              K{itemId}
            </div>  
            <button onClick={() => router.back()}>
              <Image
                src="/cancel-icon.svg"
                alt="cancel-icon"
                width={48}
                height={48}
                className="fixed top-0 right-0 cursor-pointer"
              />
            </button>
          </div>
  );
}

export default ItemHeader