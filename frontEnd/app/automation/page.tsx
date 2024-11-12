"use client";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Image,
} from "@nextui-org/react";

export default function App() {
  return (
    <Card className="">
      <CardHeader className="flex gap-3">Control Panel</CardHeader>
      <Divider />
      <CardBody></CardBody>
      <Divider />
      <CardFooter></CardFooter>
    </Card>
  );
}
