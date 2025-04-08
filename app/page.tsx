"use client";

import { useState } from "react";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Link,
  Image,
  Button,
  Input,
} from "@nextui-org/react";

import InteractiveAvatar from "@/components/InteractiveAvatar";

export default function App() {
  const [agents, setAgents] = useState([
    {
      name: "Betr Agent",
      id: process.env.NEXT_PUBLIC_RAGFLOW_AGENT_ID_BETR as string,
      image:
        "https://img.freepik.com/free-photo/view-graphic-3d-robot_23-2150849173.jpg?t=st=1742802130~exp=1742805730~hmac=9efa03cc75b15fd966be920ae0f69761878fd23253938b03a57464888ac88e0e&w=740",
      description: "Agent that can help understand about Betr company",
    },
    {
      name: "Investment Advisor Agent",
      id: process.env.NEXT_PUBLIC_RAGFLOW_AGENT_ID_ADVISOR as string,
      image:
        "https://img.freepik.com/free-vector/ai-technology-robot-cyborg-illustrations_24640-134419.jpg?t=st=1742802205~exp=1742805805~hmac=1d587adba94220ec3098fb8e778d511c0f06869c3e1c9c55820f1a7beb9fd15a&w=740",
      description:
        "An investment advisor agent that can help you with your investment",
    },
  ]);

  const [agentId, setAgentId] = useState("");

  // const [ragApikey, setRagApiKey] = useState("");
  const ragApikey = "ragflow-NlZDdhODg4MDk0ZjExZjBhN2NiMDI0Mm";
  const [isSubmitted, setIsSubmitted] = useState(true);

  // const onRagApiKeyChange = (value: string) => {
  //   setRagApiKey(value);
  // };

  // const onHeygenApiKeyChange = (value: string) => {
  //   setKeys({ ...keys, heygen_api_key: value });
  // };

  // const submitKeys = () => {
  //   if (!ragApikey) {
  //     return;
  //   }
  //   setIsSubmitted(true);
  // };

  const chooseAgent = (id: string) => {
    setAgentId(id);
  };

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="w-[80%] max-w-[1400px] flex flex-col items-start justify-start gap-5 mx-auto pt-4 pb-20">
        <div className="w-full">
          <div className="flex flex-wrap gap-5 mb-5">
            {!isSubmitted ? (
              <div className="flex flex-col gap-5">
                <h1 className="text-3xl">Please enter your keys</h1>
                <Input
                  isRequired
                  className="min-w-[400px]"
                  label="Agent Key"
                  placeholder="Enter agent key"
                  type="key"
                  // onChange={(e) =>
                  //   onRagApiKeyChange("ragflow-" + e.target.value)
                  // }
                />
                {/* <Input
                  isRequired
                  className="min-w-[400px]"
                  label="Key2"
                  placeholder="Enter key 2"
                  type="key2"
                  onChange={(e) => onHeygenApiKeyChange(e.target.value)}
                /> 
                <Button
                  className={`bg-gradient-to-tr rounded-lg ${ragApikey ? "from-indigo-500 to-indigo-300  text-white" : "bg-gray-300 text-gray-500"}`}
                  disabled={!ragApikey}
                  size="md"
                  variant="shadow"
                  onClick={submitKeys}
                >
                  Go
                </Button>
                */}
              </div>
            ) : !agentId ? (
              agents.map((agent) => (
                <Card key={agent.id} className="max-w-[400px]">
                  <CardHeader className="flex gap-3">
                    <Image
                      alt="heroui logo"
                      height={40}
                      radius="sm"
                      src={agent.image}
                      width={40}
                    />
                    <div className="flex flex-col">
                      <p className="text-md">{agent.name}</p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <p>{agent.description}</p>
                  </CardBody>
                  <Divider />
                  <CardFooter>
                    <Button
                      className="bg-gradient-to-tr from-indigo-500 to-indigo-300  text-white rounded-lg"
                      size="md"
                      variant="shadow"
                      onClick={() => chooseAgent(agent.id)}
                    >
                      Start Chat
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="w-full flex flex-col gap-5">
                <div>
                  <Button
                    color="secondary"
                    onClick={() => setAgentId("")}
                  >{`< Back`}</Button>
                </div>
                <InteractiveAvatar agentId={agentId} ragApiKey={ragApikey} />
              </div>
            )}
          </div>
          {/* <InteractiveAvatar /> */}
        </div>
      </div>
    </div>
  );
}
