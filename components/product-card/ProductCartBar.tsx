import { MdFavoriteBorder } from "react-icons/md";
import { FaRegEye } from "react-icons/fa";
import { TbArrowsRightLeft } from "react-icons/tb";
import { RiShoppingBag4Line } from "react-icons/ri";
import { ProductType } from "@/types/product";

interface ProductCartBarProps {
  product: ProductType;
}

const ProductCartBar = (product: ProductCartBarProps) => {
  return (
    <div className="text-lg flex items-center justify-center gap-2.5 shadow-none outline-none">
      <div className="border shadow-2xl bg-border p-3 rounded-full hover:text-primary hoverEffect">
        <MdFavoriteBorder />
      </div>
      <div className="border shadow-2xl bg-border p-3 rounded-full hover:text-primary hoverEffect">
        <FaRegEye />
      </div>
      <div className="border shadow-2xl bg-border p-3 rounded-full hover:text-primary hoverEffect">
        <TbArrowsRightLeft />
      </div>
      <div className="border shadow-2xl bg-border p-3 rounded-full hover:text-primary hoverEffect">
        <RiShoppingBag4Line />
      </div>
    </div>
  );
};

export default ProductCartBar;
