import React from "react";
import Svg from "../../../components/Svg/Svg";
import { SvgProps } from "../../../components/Svg/types";

const Icon: React.FC<SvgProps> = (props) => {
  return (
    <Svg viewBox="0 0 96 96" {...props}>
      <circle cx="48" cy="48" r="48" fill="#0364FF" />
      <path
        d="M48 20C32.536 20 20 32.536 20 48s12.536 28 28 28 28-12.536 28-28S63.464 20 48 20zm0 8c11.046 0 20 8.954 20 20s-8.954 20-20 20-20-8.954-20-20 8.954-20 20-20z"
        fill="white"
      />
      <path
        d="M48 36c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 8a4 4 0 110 8 4 4 0 010-8z"
        fill="white"
      />
    </Svg>
  );
};

export default Icon;
