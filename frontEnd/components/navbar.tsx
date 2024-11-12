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
import { Link } from "@nextui-org/link";
import clsx from "clsx";

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
    {
      name: "Automation Panel",
      href: "/automation",
    },
    {
      name: "Video Feed",
      href: "/video-feed",
    },
  ];

  return (
    <NextUINavbar maxWidth="xl" position="sticky">
      {/* Mobile Menu Toggle */}
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle />
      </NavbarContent>

      {/* Brand Logo */}
      <NavbarBrand className="flex">
        <h1 className="gradient-text2 text-2xl font-bold tracking-tight">
          GenAI Home Automation
        </h1>
      </NavbarBrand>

      {/* Desktop Navigation Items */}
      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {items.map((item, index) => (
          <NavbarItem key={`${item.name}-${index}`}>
            <Link color="foreground" href={item.href}>
              <Button color="primary" variant="ghost">
                {item.name}
              </Button>
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* Mobile Navigation Menu */}
      <NavbarMenu>
        {items.map((item, index) => (
          <NavbarMenuItem key={`${item.name}-${index}`}>
            <Link className="w-full" href={item.href} size="lg">
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </NextUINavbar>
  );
};
