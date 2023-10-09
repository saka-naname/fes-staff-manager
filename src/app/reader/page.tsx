import { Container, Heading } from "@chakra-ui/react";
import TestButton from "@/app/components/feliCaTester";

export default function Reader() {
  return (
    <>
      <Container>
        <Heading h={1} mb={16}>
          FeliCa Tester
        </Heading>
        <TestButton />
      </Container>
    </>
  );
}
