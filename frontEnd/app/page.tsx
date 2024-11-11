import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import ChatPage from "./chatPage";
import "regenerator-runtime/runtime"; // Add this line
import { Card, CardFooter } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";

export default function Home() {
  return (
    <section className="flex flex-row items-center justify-center min-w-full min-h-full ">
      <Card>
        <ChatPage />
        <Divider className="neon-divider" />
        <CardFooter>
          
        </CardFooter>
      </Card>
    </section>
  );
}
