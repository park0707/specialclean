// src/home_parts/header.tsx
import { Link } from '@tanstack/react-router';
import { Mymenu } from './mymenu';

export default function Header() {
  return (
    <div className="flex justify-between px-4 sm:px-8 md:px-16 lg:px-90 py-2 items-center w-full">
      <Link
        to="/"
        className="flex items-center gap-[2px] cursor-pointer"
      >
        <img src="/images/로고.png" alt="로고" className="w-[35px] sm:w-[45px] md:w-[60px] h-auto" />
        <div className="logo_text text-[18px] sm:text-[24px] md:text-[30px] text-[#1d4ed8] pt-1">클린 매칭</div>
      </Link>
      <Mymenu />
    </div>
  );
}