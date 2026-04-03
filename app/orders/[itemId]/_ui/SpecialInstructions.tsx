'client use'

import { Dispatch, SetStateAction } from "react";

type instructionsProp = {
  instructions: string,
  setInstructions: Dispatch<SetStateAction<string>>
}
function SpecialInstructions({instructions, setInstructions}: instructionsProp) {


  return(
    <section className="flex justify-center flex-col">
      <div className="flex justify-center">
      <h3 className="font-bold font-roboto-mono m-4 "> Special Instructions </h3> 
      </div>
      <div className="flex justify-center">
        <textarea maxLength={200} className="resize-none flex flex-col border p-3 w-4/5 rounded-2xl" placeholder="e.g. Less Sugar"></textarea>
      </div>

    </section>
  );
}
    
export default SpecialInstructions
