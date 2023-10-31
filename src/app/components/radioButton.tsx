import { Box, UseRadioProps, chakra, Text, useRadio } from "@chakra-ui/react";

interface CustomRadioButtonProps extends UseRadioProps {
  mainText: string;
  subText: string;
}

export const RadioButton = (props: CustomRadioButtonProps) => {
  const { mainText, subText, ...radioProps } = props;
  const { state, getInputProps, getRadioProps, htmlProps } =
    useRadio(radioProps);

  return (
    <chakra.label {...htmlProps} cursor="pointer" mx="24">
      <input {...getInputProps({})} hidden />
      <Box
        {...getRadioProps()}
        borderWidth={state.isChecked ? "3px" : "3px"}
        borderColor={state.isChecked ? "red.500" : "gray.300"}
        w="240px"
        h="240px"
        px="16px"
        py="8px"
      >
        <Text fontSize="64px" fontWeight="bold" fontFamily="Noto Sans JP">
          {mainText}
        </Text>
        <Text fontSize="32px" fontFamily="Noto Sans JP">
          {subText}
        </Text>
      </Box>
    </chakra.label>
  );
};
