import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import shopImg from "../../../attached_assets/shop.png";
import activitiesImg from "../../../attached_assets/activities.png";
import informationImg from "../../../attached_assets/information.png";
import theaterImg from "../../../attached_assets/theater.png";

const NAV_IMAGE_SIZE = 1024;
const DESKTOP_IMAGE_SHADOW = "drop-shadow(0 8px 15px rgba(0, 0, 0, 0.35))";
const MOBILE_IMAGE_SHADOW = "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))";

const activateOnEnterOrSpace = (
  event: React.KeyboardEvent,
  activate: () => void,
) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    activate();
  }
};

type NavItemProps = {
  image: string;
  alt: string;
  ariaLabel: string;
  onClick: () => void;
};

type DesktopNavItemProps = NavItemProps & {
  overlayClass: string;
  imageWidthClass: string;
  animationDelay: string;
  offset: React.CSSProperties;
};

const DesktopNavItem = ({
  image,
  alt,
  ariaLabel,
  onClick,
  overlayClass,
  imageWidthClass,
  animationDelay,
  offset,
}: DesktopNavItemProps) => (
  <div
    className={`${overlayClass} animate-float cursor-pointer transition-all duration-300 ease-out hover:transform hover:-translate-y-3 hover:scale-105 hover:drop-shadow-2xl group`}
    style={{
      filter: "drop-shadow(0 5px 10px rgba(0, 0, 0, 0.15))",
      animationDelay,
      position: "absolute",
      ...offset,
    }}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => activateOnEnterOrSpace(e, onClick)}
    aria-label={ariaLabel}
  >
    <img
      src={image}
      alt={alt}
      width={NAV_IMAGE_SIZE}
      height={NAV_IMAGE_SIZE}
      className={`${imageWidthClass} h-auto relative`}
      style={{ filter: DESKTOP_IMAGE_SHADOW }}
    />
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -z-10 w-40 h-10 bg-amber-100/50 rounded-full blur-md transition-all duration-300 group-hover:bg-amber-200/60 group-hover:w-48 group-hover:h-12"></div>
  </div>
);

const MobileNavItem = ({
  image,
  alt,
  ariaLabel,
  onClick,
  alignClass,
}: NavItemProps & { alignClass: string }) => (
  <div
    className={`flex ${alignClass} justify-center cursor-pointer transition-all duration-300 ease-out active:scale-95`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => activateOnEnterOrSpace(e, onClick)}
    aria-label={ariaLabel}
  >
    <img
      src={image}
      alt={alt}
      width={NAV_IMAGE_SIZE}
      height={NAV_IMAGE_SIZE}
      className="w-[38vw] max-w-[150px] h-auto"
      style={{ filter: MOBILE_IMAGE_SHADOW }}
    />
  </div>
);

export default function Home() {
  const [, setLocation] = useLocation();

  const [showDrawAnimation] = useState(
    () => sessionStorage.getItem("came-from-internal") !== "true",
  );

  useEffect(() => {
    sessionStorage.removeItem("came-from-internal");
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const navigateToInternalPage = (path: string) => {
    sessionStorage.setItem("came-from-internal", "true");
    setLocation(path);
  };

  const handleShopClick = () => navigateToInternalPage("/shop");
  const handleTheaterClick = () => navigateToInternalPage("/birds-eye-view");
  const handleActivitiesClick = () => navigateToInternalPage("/activities");
  const handleInformationClick = () => navigateToInternalPage("/information");

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center justify-center mb-64 min-[480px]:mb-72 md:mb-32 px-4">

          {showDrawAnimation ? (
            <h1 className="font-['Great_Vibes',_cursive] text-6xl md:text-7xl lg:text-8xl text-center text-white tracking-wide mb-1 min-[480px]:mb-2 md:mb-8">
              <svg width="100%" height="100" viewBox="0 0 700 100" className="overflow-hidden max-w-[95vw] w-full">
                <motion.text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  fontFamily="'Great Vibes', cursive"
                  fontSize="58"
                  filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"
                  className="responsive-text"
                  initial={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ delay: 0.5, duration: 3, ease: "easeOut" }}
                >
                  El Segundo High School
                </motion.text>
                <motion.text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontFamily="'Great Vibes', cursive"
                  fontSize="58"
                  filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"
                  className="responsive-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3.5, duration: 0.5 }}
                >
                  El Segundo High School
                </motion.text>
              </svg>
            </h1>
          ) : (
            <motion.h1
              className="font-['Great_Vibes',_cursive] text-center text-white tracking-wide mb-1 min-[480px]:mb-2 md:mb-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
                WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.3)'
              }}
            >
              El Segundo High School
            </motion.h1>
          )}

          {showDrawAnimation ? (
            <h1 className="font-['Great_Vibes',_cursive] text-8xl md:text-9xl lg:text-[10rem] font-bold text-white">
              <svg width="100%" height="160" viewBox="0 0 300 160" className="overflow-visible max-w-[90vw] w-full">
                <motion.text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  fontFamily="'Great Vibes', cursive"
                  fontSize="100"
                  fontWeight="bold"
                  filter="drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))"
                  className="responsive-text"
                  initial={{ strokeDasharray: "1000 1000", strokeDashoffset: 1000 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ delay: 2, duration: 2.5, ease: "easeInOut" }}
                >
                  ASB
                </motion.text>
                <motion.text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontFamily="'Great Vibes', cursive"
                  fontSize="100"
                  fontWeight="bold"
                  filter="drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))"
                  className="responsive-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 4.5, duration: 0.5 }}
                >
                  ASB
                </motion.text>
              </svg>
            </h1>
          ) : (
            <motion.h1
              className="font-['Great_Vibes',_cursive] font-bold text-white text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{
                filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))',
                WebkitTextStroke: '0.8px rgba(0, 0, 0, 0.3)'
              }}
            >
              ASB
            </motion.h1>
          )}
        </div>
      </div>

      <div className="min-h-screen w-screen relative flex items-center justify-center overflow-hidden">
        <div className="hidden md:flex absolute bottom-0 w-full h-4/5 items-end justify-center pb-6 lg:pb-8 z-30">
          <div className="relative w-full max-w-[100rem] flex flex-row justify-between px-8 lg:px-0">

            <div className="relative h-full w-1/2">
              <DesktopNavItem
                overlayClass="shop-overlay"
                image={shopImg}
                alt="School Merchandise Shop"
                ariaLabel="Visit the school merchandise shop"
                onClick={handleShopClick}
                imageWidthClass="w-56 lg:w-64"
                animationDelay="0.1s"
                offset={{ bottom: "0", left: "12rem" }}
              />

              <DesktopNavItem
                overlayClass="theater-overlay"
                image={theaterImg}
                alt="School Theater"
                ariaLabel="Visit the school theater page"
                onClick={handleTheaterClick}
                imageWidthClass="w-52 lg:w-60"
                animationDelay="0.2s"
                offset={{ bottom: "7rem", left: "25rem" }}
              />
            </div>

            <div className="relative h-full w-1/2">
              <DesktopNavItem
                overlayClass="activities-overlay"
                image={activitiesImg}
                alt="School Activities"
                ariaLabel="Visit the school activities page"
                onClick={handleActivitiesClick}
                imageWidthClass="w-56 lg:w-64"
                animationDelay="0.3s"
                offset={{ bottom: "0", right: "12rem" }}
              />

              <DesktopNavItem
                overlayClass="information-overlay"
                image={informationImg}
                alt="School Information"
                ariaLabel="Visit the school information page"
                onClick={handleInformationClick}
                imageWidthClass="w-52 lg:w-60"
                animationDelay="0.4s"
                offset={{ bottom: "7rem", right: "25rem" }}
              />
            </div>
          </div>
        </div>

        <div className="md:hidden absolute bottom-0 w-full z-30 pb-16">
          <div className="grid grid-cols-2 grid-rows-2 gap-0 px-4" style={{ height: '32vh' }}>
            <MobileNavItem
              image={theaterImg}
              alt="School Theater"
              ariaLabel="Visit the school theater page"
              onClick={handleTheaterClick}
              alignClass="items-end"
            />

            <MobileNavItem
              image={informationImg}
              alt="School Information"
              ariaLabel="Visit the school information page"
              onClick={handleInformationClick}
              alignClass="items-end"
            />

            <MobileNavItem
              image={shopImg}
              alt="School Merchandise Shop"
              ariaLabel="Visit the school merchandise shop"
              onClick={handleShopClick}
              alignClass="items-start"
            />

            <MobileNavItem
              image={activitiesImg}
              alt="School Activities"
              ariaLabel="Visit the school activities page"
              onClick={handleActivitiesClick}
              alignClass="items-start"
            />
          </div>
        </div>
      </div>
    </>
  );
}
