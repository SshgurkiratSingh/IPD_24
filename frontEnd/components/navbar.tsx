import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import { Button } from "@nextui-org/button";
import { Kbd } from "@nextui-org/kbd";
import { Link } from "@nextui-org/link";
import { Input } from "@nextui-org/input";
import { link as linkStyles } from "@nextui-org/theme";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
  Logo,
} from "@/components/icons";

export const Navbar = () => {
  const items = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "Control Panel",
      href: "/control",
    },
  ];

  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      <NavbarBrand>
        <h1 className="gradient-text2 text-2xl font-bold tracking-tight">
          GenAI Home Automation
        </h1>
      </NavbarBrand>
      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {" "}
        {items.map((item, index) => (
          <NavbarItem key={`${item}-${index}`}>
            <Link color="foreground" href={item.href}>
              <Button color="primary" variant="ghost">
                {item.name}
              </Button>
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>
      <NavbarMenu></NavbarMenu>
    </NextUINavbar>
  );
};
