import { Link } from "@nextui-org/link";
import { FaRobot, FaComments, FaMicrochip, FaChartLine, FaShieldAlt, FaCar } from "react-icons/fa";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import "regenerator-runtime/runtime";

export default function Home() {
  const modules = [
    { title: "Chat Assistant", icon: <FaComments className="text-4xl text-blue-500" />, href: "/chat", description: "Interact with the AI home assistant" },
    { title: "Security System", icon: <FaShieldAlt className="text-4xl text-red-500" />, href: "/securitySystem", description: "Monitor CCTV feeds and access control" },
    { title: "Analysis & History", icon: <FaChartLine className="text-4xl text-green-500" />, href: "/historyPage", description: "View telemetry trends and logs" },
    { title: "Automation Control", icon: <FaMicrochip className="text-4xl text-purple-500" />, href: "/control", description: "Manage device automations directly" },
    { title: "Smart Parking", icon: <FaCar className="text-4xl text-yellow-500" />, href: "/smartParking", description: "View garage space and parking data" },
  ];

  return (
    <section className="flex flex-col items-center justify-start gap-8 min-w-full min-h-screen py-10 px-4 bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center space-y-4 max-w-3xl">
        <FaRobot className="text-6xl text-primary mx-auto mb-4 animate-bounce" />
        <h1 className="text-5xl font-extrabold tracking-tight text-white">
          IPD 24 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Command Center</span>
        </h1>
        <p className="text-lg text-gray-400">
          A unified interface for home automation, security, and smart device management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mt-8">
        {modules.map((mod, index) => (
          <Link href={mod.href} key={index} className="w-full transform transition hover:scale-105">
            <Card className="w-full h-full bg-gray-800/50 backdrop-blur-md border border-gray-700 hover:border-primary/50 transition-colors">
              <CardHeader className="flex gap-4 p-6">
                {mod.icon}
                <div className="flex flex-col">
                  <p className="text-xl font-bold text-white">{mod.title}</p>
                </div>
              </CardHeader>
              <Divider className="bg-gray-700" />
              <CardBody className="p-6">
                <p className="text-gray-300">{mod.description}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
