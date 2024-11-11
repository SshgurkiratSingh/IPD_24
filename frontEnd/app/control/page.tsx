import { title } from "@/components/primitives";
import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { Link } from "@nextui-org/link";
import mainPageConfig from "@/MainPageConfigModular";
export default function AboutPage() {
  return (
    <Card className="">
      <CardHeader className="flex gap-3 gradient-text3">
        <h4 className={title()}>Control Panel</h4>
      </CardHeader>
      <Divider />
      <CardBody></CardBody>
      <Divider />
      <CardFooter></CardFooter>
    </Card>
  );
}
