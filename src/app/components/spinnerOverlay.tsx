import { Fade, Center, Spinner } from "@chakra-ui/react";

type SpinnerOverlayProps = {
  in: boolean;
};

export const SpinnerOverlay = (props: SpinnerOverlayProps) => {
  return (
    <Fade in={props.in} unmountOnExit={true}>
      <Center
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        bg="blackAlpha.200"
      >
        <Spinner
          thickness="4px"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Center>
    </Fade>
  );
};
