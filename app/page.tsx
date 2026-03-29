import './globals.css'
import Header from '@/app/components/Header';
import Promotions from '@/app/components/Promotions';
export default function Home() {
  return (
    <div className='bg-[#FAF3E0] min-h-screen'>
      <Header />
      <h2 className='font-roboto-slab text-2xl text-center mb-1 flex items-center justify-center'> MENU</h2>
      <Promotions />
    </div>
    );
}
