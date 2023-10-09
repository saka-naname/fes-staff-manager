"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import Fonts from "./components/styles/fonts";
import theme from "./components/styles/theme";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <Fonts />
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
