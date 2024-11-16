import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import { FaRobot, FaComments, FaMicrochip } from "react-icons/fa";
import ChatPage from "./chatPage";
import "regenerator-runtime/runtime"; // Add this line

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 min-w-full min-h-full py-8 md:py-10">
      <div className="flex gap-4">
        <FaRobot className="text-4xl text-primary" />
        <FaComments className="text-4xl text-secondary" />
        <FaMicrochip className="text-4xl text-success" />
      </div>
      <ChatPage />
    </section>
  );
}
