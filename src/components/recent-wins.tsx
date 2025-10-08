"use client";

import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import Image from "next/image";
import { FaChartLine } from "react-icons/fa";

interface RecentWin {
  id: string;
  userName: string;
  amount: string;
  gameImage: string;
}

export default function RecentWins() {
  const [wins, setWins] = useState<RecentWin[]>([]);

  useEffect(() => {
    // Mock data for recent wins - using the original game images
    const mockWins: RecentWin[] = [
      {
        id: "1",
        userName: "Hidden",
        amount: "3,628 XMR",
        gameImage: "https://bc.imgix.net/game/image/f3c529b0a2.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "2",
        userName: "Btxsyekheucc",
        amount: "120.3 ETH",
        gameImage: "https://bc.imgix.net/game/image/3758_Sweet Bonanza.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "3",
        userName: "Hidden",
        amount: "498K USDT",
        gameImage: "https://bc.imgix.net/game/image/13106_The Zeus vs Hades.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "4",
        userName: "Fhdrehopoxcc",
        amount: "381K USDT",
        gameImage: "https://bc.imgix.net/game/image/97e458b32f.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "5",
        userName: "Hidden",
        amount: "1,101 XMR",
        gameImage: "https://bc.imgix.net/game/image/15935_Sugar rush 1000.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "6",
        userName: "BETPORTALL",
        amount: "NGN 464.84M",
        gameImage: "https://bc.imgix.net/game/image/8944712a5d.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "7",
        userName: "EllieEllie",
        amount: "218.4K USDT",
        gameImage: "https://bc.imgix.net/game/image/c5235e23d9.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "8",
        userName: "Hidden",
        amount: "¥32M",
        gameImage: "https://bc.imgix.net/game/image/e62d2fed8c.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "9",
        userName: "CryptoKing",
        amount: "2,847 ETH",
        gameImage: "https://bc.imgix.net/game/image/2f2fb0a3e8.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "10",
        userName: "Hidden",
        amount: "892K USDT",
        gameImage: "https://bc.imgix.net/game/image/0afd1d52b2.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "11",
        userName: "Zyvptdiggtac",
        amount: "119.88K USDT",
        gameImage: "https://bc.imgix.net/game/image/aa1281b64a.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "12",
        userName: "tony1100",
        amount: "199.8K USDT",
        gameImage: "https://bc.imgix.net/game/image/3660abce4d.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "13",
        userName: "Hidden",
        amount: "156.7 BTC",
        gameImage: "https://bc.imgix.net/game/image/1c27672ffd.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "14",
        userName: "Ocpyghsucycc",
        amount: "198.8K USDT",
        gameImage: "https://bc.imgix.net/game/image/78b232954e.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "15",
        userName: "Hidden",
        amount: "777.3 XRP",
        gameImage: "https://bc.imgix.net/game/image/84a331af34.png?_v=4&auto=format&dpr=1&w=200",
      },
      {
        id: "16",
        userName: "EliteTrader",
        amount: "3.2M USDT",
        gameImage: "https://bc.imgix.net/game/image/15547_Land of the Free.png?_v=4&auto=format&dpr=1&w=200",
      },
    ];

    setWins(mockWins);
  }, []);

  const WinCard = ({ win }: { win: RecentWin }) => (
    <div className="flex-none flex flex-col items-center w-14 hover:opacity-80 transition-opacity cursor-pointer mr-3">
      {/* Card with Image */}
      <div className="relative mb-1 w-full rounded-lg pt-[133%] overflow-hidden">
        <Image
          src={win.gameImage}
          alt="Game"
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 56px, 56px"
          onError={(e) => {
            // Fallback to a solid color with initials if image fails
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/200x267/hsl(var(--primary))/hsl(var(--primary-foreground))?text=${win.userName.substring(0, 2).toUpperCase()}`;
          }}
        />
      </div>

      {/* User Info */}
      <div className="w-[118%] text-center">
        {/* Username */}
        <div className="flex items-center justify-center font-extrabold text-muted-foreground text-xs">
          <Image
            src="https://bc.imgix.net/assets/vip/badge-diamond.png?_v=4&auto=format&dpr=1&w=20"
            alt="VIP"
            width={14}
            height={14}
            className="mr-1"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <span className="truncate -ml-0.5" style={{ fontSize: '10px' }}>
            {win.userName}
          </span>
        </div>

        {/* Amount */}
        <div className="whitespace-nowrap text-center font-extrabold text-primary" style={{ fontSize: '10px' }}>
          {win.amount}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full py-4">
      <Marquee
        speed={30}
        pauseOnHover={true}
        gradient={false}
        className="gap-8"
      >
        {wins.map((win) => (
          <WinCard key={win.id} win={win} />
        ))}
      </Marquee>
    </div>
  );
}