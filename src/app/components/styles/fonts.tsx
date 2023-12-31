import { Global } from "@emotion/react";

const Fonts = () => (
  <Global
    styles={`
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap');
        `}
  />
);

export default Fonts;
