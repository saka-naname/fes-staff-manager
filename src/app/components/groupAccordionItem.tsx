import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Box,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { MemberBadge } from "./memberBadge";
import React from "react";
import { MemberSafe } from "@/lib/types";

type GroupAccordionItemProps = {
  name: string;
  members: MemberSafe[];
};

export const GroupAccordionItem = React.memo(function GroupAccordionItem(
  props: GroupAccordionItemProps,
) {
  const { name, members } = props;

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box flex="1" textAlign="left">
            <Text>
              {name}
              <Badge
                colorScheme={members.length > 0 ? "gray" : "red"}
                ml="2"
                mb="1"
              >
                {members.length}
              </Badge>
            </Text>
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Wrap>
          {members.map((member, index) => (
            <WrapItem key={index}>
              <MemberBadge member={member} />
            </WrapItem>
          ))}
        </Wrap>
      </AccordionPanel>
    </AccordionItem>
  );
});
