import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

/** Nothing at this address. */
const NotFound = () => (
  <main className="grid min-h-dvh place-content-center gap-6 bg-[#efeff5] px-6 text-center font-sans text-[#0b1533]">
    <Wordmark className="text-[24vmin] leading-none font-bold tracking-tight" />
    <p className="text-xl">This one flew away.</p>
    <Link
      className="mx-auto rounded-full bg-[#0b1533] px-5 py-3 text-sm font-semibold text-white transition-[scale] duration-200 ease-spring hover:scale-105 active:scale-95"
      href="/"
    >
      Home
    </Link>
  </main>
);

export default NotFound;
