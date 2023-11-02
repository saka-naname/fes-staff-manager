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
import { MemberWithStatuses } from "@/lib/types";
import React from "react";
import { Member } from "@prisma/client";

type GroupAccordionItemProps = {
  name: string;
  members: Member[];
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
          {members.map((member) => (
            <WrapItem>
              <MemberBadge member={member} />
            </WrapItem>
          ))}
        </Wrap>
      </AccordionPanel>
    </AccordionItem>
  );
});
